"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { parseFile, detectBank, ParsedRow } from "@/lib/parsers";
import { CATEGORIES, detectCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

interface ImportRow extends ParsedRow {
  uid: string;
  categoryId: string;
  selected: boolean;
  isDupe: boolean;
}

interface Props {
  userId: string;
  recentHashes: string[];
}

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const BANK_ICONS: Record<string, string> = {
  Nubank:    "fa-credit-card",
  Inter:     "fa-mobile-screen",
  "C6 Bank": "fa-building-columns",
  Bradesco:  "fa-building-columns",
  "Itaú":    "fa-building-columns",
};

export default function ImportarClient({ userId, recentHashes }: Props) {
  const [step, setStep] = useState<"drop" | "preview" | "done">("drop");
  const [bankName, setBankName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hashSet = useMemo(() => new Set(recentHashes), [recentHashes]);

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseFile(file.name, content);
      setBankName(detectBank(file.name));
      setRows(parsed.map((r, i) => ({
        ...r,
        uid: `${i}-${r.date}-${r.amount}`,
        categoryId: detectCategory(r.description),
        selected: true,
        isDupe: hashSet.has(`${r.date}-${r.amount}`),
      })));
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [hashSet]);

  const toggleRow  = (uid: string) =>
    setRows(p => p.map(r => r.uid === uid ? { ...r, selected: !r.selected } : r));
  const toggleAll  = () => {
    const all = rows.every(r => r.selected);
    setRows(p => p.map(r => ({ ...r, selected: !all })));
  };
  const setCat     = (uid: string, catId: string) =>
    setRows(p => p.map(r => r.uid === uid ? { ...r, categoryId: catId } : r));
  const setType    = (uid: string, t: "income" | "expense") =>
    setRows(p => p.map(r => r.uid === uid ? { ...r, type: t } : r));

  async function handleImport() {
    const toSave = rows.filter(r => r.selected && !r.isDupe);
    if (!toSave.length) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").insert(
      toSave.map(r => ({
        user_id:             userId,
        description:         r.description,
        amount:              r.amount,
        type:                r.type,
        category_id:         r.categoryId,
        date:                r.date,
        is_imported:         true,
        installments:        1,
        installment_current: 1,
      }))
    );
    setSaving(false);
    if (!error) { setSavedCount(toSave.length); setStep("done"); }
  }

  const selectedCount = rows.filter(r => r.selected && !r.isDupe).length;
  const dupeCount     = rows.filter(r => r.isDupe).length;

  /* ──────────── DROP ZONE ──────────── */
  if (step === "drop") return (
    <div className="flex flex-col gap-5">
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-5 py-14 text-center cursor-pointer rounded-3xl transition-all"
        style={{
          background: dragOver ? "rgba(244,114,182,0.08)" : "var(--card)",
          border: `2px dashed ${dragOver ? "var(--primary)" : "rgba(244,114,182,0.3)"}`,
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.ofx,.txt" className="hidden"
          onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 20px rgba(244,114,182,0.3)" }}
        >
          <i className="fa-solid fa-file-arrow-up text-2xl text-white" />
        </div>

        <div>
          <p className="font-semibold text-base">Soltar extrato aqui</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Ou toque para selecionar o arquivo
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {["Nubank CSV", "Inter OFX", "C6 Bank CSV", "Bradesco OFX"].map(b => (
            <span key={b} className="badge-gold">{b}</span>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="card-pingo flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          Como exportar do seu banco
        </p>
        {[
          { bank: "Nubank",    icon: "fa-credit-card",    tip: "App → Fatura → Exportar fatura (CSV)" },
          { bank: "Inter",     icon: "fa-mobile-screen",  tip: "App → Extrato → Exportar → OFX" },
          { bank: "C6 Bank",   icon: "fa-building-columns", tip: "App → Extrato → Exportar CSV" },
        ].map(({ bank, icon, tip }) => (
          <div key={bank} className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--muted)" }}>
              <i className={`fa-solid ${icon} text-sm`} style={{ color: "var(--primary)" }} />
            </span>
            <div>
              <p className="text-xs font-medium">{bank}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ──────────── DONE ──────────── */
  if (step === "done") return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center animate-coin-drop"
        style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 30px rgba(244,114,182,0.4)" }}
      >
        <i className="fa-solid fa-piggy-bank text-4xl text-white" />
      </div>
      <div>
        <p className="text-xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
          Pingado!
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {savedCount} transações importadas com sucesso
        </p>
      </div>
      <button
        onClick={() => { setStep("drop"); setRows([]); setSavedCount(0); }}
        className="btn-primary py-3 px-8"
      >
        <i className="fa-solid fa-file-arrow-up mr-2" />
        Importar outro arquivo
      </button>
    </div>
  );

  /* ──────────── PREVIEW ──────────── */
  return (
    <div className="flex flex-col gap-3">
      {/* Bank header */}
      <div className="card-pingo flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)" }}
        >
          <i className={`fa-solid ${BANK_ICONS[bankName] ?? "fa-file-csv"} text-white`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{bankName}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {rows.length} transações
            {dupeCount > 0 && ` · ${dupeCount} possíveis duplicatas (ignoradas)`}
          </p>
        </div>
        <button
          onClick={() => { setStep("drop"); setRows([]); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--input)" }}
        >
          <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* Select all + counter */}
      <div className="flex items-center justify-between px-1">
        <button onClick={toggleAll} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
          {rows.every(r => r.selected) ? "Desmarcar todos" : "Selecionar todos"}
        </button>
        <span className="mono-data text-xs" style={{ color: "var(--muted-foreground)" }}>
          {selectedCount} selecionadas
        </span>
      </div>

      {/* Row list */}
      {rows.map(row => {
        const cat = CATEGORIES.find(c => c.id === row.categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
        return (
          <div
            key={row.uid}
            className="rounded-2xl p-3 flex flex-col gap-2 transition-all"
            style={{
              background: row.isDupe ? "rgba(251,191,36,0.05)" : row.selected ? "var(--card)" : "transparent",
              border: `1px solid ${row.isDupe ? "rgba(251,191,36,0.3)" : row.selected ? "var(--border)" : "rgba(255,255,255,0.04)"}`,
              opacity: (!row.selected && !row.isDupe) ? 0.45 : 1,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <button
                onClick={() => !row.isDupe && toggleRow(row.uid)}
                disabled={row.isDupe}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: row.isDupe ? "var(--muted)" : row.selected ? "var(--primary)" : "transparent",
                  border: `1px solid ${row.isDupe ? "rgba(251,191,36,0.4)" : row.selected ? "transparent" : "var(--border)"}`,
                }}
              >
                {row.isDupe
                  ? <i className="fa-solid fa-minus text-[8px]" style={{ color: "var(--gold)" }} />
                  : row.selected && <i className="fa-solid fa-check text-[9px] text-white" />}
              </button>

              {/* Icon */}
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${cat.color}20` }}
              >
                <i className={`fa-solid ${cat.icon} text-xs`} style={{ color: cat.color }} />
              </span>

              {/* Description + date */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{row.description}</p>
                <p className="text-[10px] mt-0.5 mono-data" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(row.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  {row.isDupe && <span className="ml-2" style={{ color: "var(--gold)" }}>· duplicata</span>}
                </p>
              </div>

              {/* Amount + type toggle */}
              <div className="text-right flex-shrink-0">
                <p className="mono-data text-xs font-semibold"
                  style={{ color: row.type === "income" ? "var(--income)" : "var(--expense)" }}>
                  {row.type === "income" ? "+" : "-"}{BRL(row.amount)}
                </p>
                {!row.isDupe && (
                  <button
                    onClick={() => setType(row.uid, row.type === "income" ? "expense" : "income")}
                    className="text-[9px] mt-0.5 underline"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {row.type === "income" ? "marcar como saída" : "marcar como entrada"}
                  </button>
                )}
              </div>
            </div>

            {/* Category pills (only when selected) */}
            {row.selected && !row.isDupe && (
              <div className="flex gap-1.5 overflow-x-auto pl-8" style={{ scrollbarWidth: "none" }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCat(row.uid, c.id)}
                    className="flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] transition-all"
                    style={{
                      background: row.categoryId === c.id ? `${c.color}25` : "var(--muted)",
                      border: `1px solid ${row.categoryId === c.id ? c.color + "70" : "transparent"}`,
                      color: row.categoryId === c.id ? c.color : "var(--muted-foreground)",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Sticky confirm button */}
      <div className="sticky bottom-20 py-2">
        <button
          onClick={handleImport}
          disabled={saving || selectedCount === 0}
          className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-40"
        >
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Salvando...</>
            : <><i className="fa-solid fa-piggy-bank mr-2" />Pingar {selectedCount} transações no porquinho</>}
        </button>
      </div>
    </div>
  );
}
