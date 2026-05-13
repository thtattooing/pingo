"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import type { Transaction } from "./TransactionList";

export default function EditTransactionModal({
  tx,
  onClose,
  onSaved,
}: {
  tx: Transaction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(tx.description);
  const [amount, setAmount]           = useState(String(tx.amount));
  const [categoryId, setCategoryId]   = useState(tx.category);
  const [type, setType]               = useState<"income" | "expense">(tx.type);
  const [isShared, setIsShared]       = useState(tx.isShared ?? false);
  const [date, setDate]               = useState(tx.date ?? "");
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentCat = CATEGORIES.find(c => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").update({
      description,
      amount:      parseFloat(amount.replace(",", ".")),
      type,
      category_id: categoryId,
      is_shared:   isShared,
      date:        date || undefined,
    }).eq("id", tx.id);
    setSaving(false);
    if (!error) { onSaved(); onClose(); }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", tx.id);
    setDeleting(false);
    onSaved(); onClose();
  }

  return (
    // z-[60] fica acima do BottomNav (z-50)
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Sheet — scrollável, não ultrapassa 90% da tela */}
      <div className="w-full max-w-md rounded-t-3xl flex flex-col animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", maxHeight: "90dvh" }}>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--muted)" }} />
        </div>

        {/* Header fixo */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${currentCat.color}20` }}>
              <i className={`fa-solid ${currentCat.icon} text-sm`} style={{ color: currentCat.color }} />
            </div>
            <h2 className="font-semibold text-base">Editar transação</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 flex flex-col gap-4 px-5 py-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}>

          {/* Tipo */}
          <div className="flex rounded-xl overflow-hidden" style={{ background: "var(--input)" }}>
            {(["expense", "income"] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: type === t ? (t === "income" ? "var(--income)" : "var(--expense)") : "transparent",
                  color:      type === t ? "#fff" : "var(--muted-foreground)",
                  borderRadius: "0.75rem",
                }}>
                <i className={`fa-solid ${t === "income" ? "fa-arrow-down" : "fa-arrow-up"} mr-1.5 text-xs`} />
                {t === "income" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Descrição</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              placeholder="Descrição" />
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Valor (R$)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data"
                style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                placeholder="0,00" inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>
          </div>

          {/* Categoria — grid completo */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Categoria</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.filter(c => c.id !== "outros").map(c => (
                <button key={c.id} onClick={() => setCategoryId(c.id)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all"
                  style={{
                    background: categoryId === c.id ? `${c.color}25` : "var(--input)",
                    border:     `1px solid ${categoryId === c.id ? c.color + "70" : "transparent"}`,
                  }}>
                  <i className={`fa-solid ${c.icon} text-base`} style={{ color: c.color }} />
                  <span className="text-[9px] text-center leading-tight" style={{ color: "var(--muted-foreground)" }}>
                    {c.name.split(" ")[0]}
                  </span>
                </button>
              ))}
              {/* Outros */}
              {CATEGORIES.filter(c => c.id === "outros").map(c => (
                <button key={c.id} onClick={() => setCategoryId(c.id)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all"
                  style={{
                    background: categoryId === c.id ? `${c.color}25` : "var(--input)",
                    border:     `1px solid ${categoryId === c.id ? c.color + "70" : "transparent"}`,
                  }}>
                  <i className={`fa-solid ${c.icon} text-base`} style={{ color: c.color }} />
                  <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Outros</span>
                </button>
              ))}
            </div>
          </div>

          {/* Despesa do casal */}
          <button onClick={() => setIsShared(v => !v)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{
              background: isShared ? "rgba(244,114,182,0.12)" : "var(--input)",
              border:     isShared ? "1px solid rgba(244,114,182,0.3)" : "1px solid transparent",
            }}>
            <i className="fa-solid fa-heart text-sm" style={{ color: isShared ? "var(--primary)" : "var(--muted-foreground)" }} />
            <span className="text-sm flex-1 text-left">Despesa do casal</span>
            <div className="w-10 h-5 rounded-full relative transition-all"
              style={{ background: isShared ? "var(--primary)" : "var(--muted)" }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: isShared ? "calc(100% - 1.125rem)" : "0.125rem" }} />
            </div>
          </button>
        </div>

        {/* Botões fixos no rodapé */}
        <div className="flex gap-3 px-5 py-4 flex-shrink-0"
          style={{
            borderTop: "1px solid var(--border)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
          }}>
          {!confirmDelete ? (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all"
              style={{ background: "rgba(239,68,68,0.12)", color: "var(--expense)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <i className="fa-solid fa-trash-can" />
              Excluir
            </button>
          ) : (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: "rgba(239,68,68,0.8)", color: "#fff" }}>
              {deleting ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-triangle-exclamation" />Confirmar</>}
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold btn-primary">
            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-check mr-2" />Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
