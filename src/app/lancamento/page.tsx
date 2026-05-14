"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, detectCategory } from "@/lib/categories";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";

export default function LancamentoPage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amount, setAmount]           = useState("");
  const [type, setType]               = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId]   = useState("outros");
  const [date, setDate]               = useState(new Date().toISOString().split("T")[0]);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<"credit_card" | "checking">("checking");
  const [installments, setInstallments] = useState("1");
  const [accounts, setAccounts]       = useState<{ name: string; type: string }[]>([]);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [userId, setUserId]           = useState<string | null>(null);

  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    descRef.current?.focus();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    supabase
      .from("card_settings")
      .select("account_name,account_type")
      .then(({ data }) => {
        if (data) setAccounts(data.map(d => ({ name: d.account_name, type: d.account_type ?? "credit_card" })));
      });
  }, []);

  function handleDescChange(val: string) {
    setDescription(val);
    if (val.length > 3) {
      const detected = detectCategory(val);
      if (detected !== "outros") setCategoryId(detected);
      const lower = val.toLowerCase();
      if (["recebi","salario","salário","freelance","renda","caiu","depositaram","entrada"].some(w => lower.includes(w))) {
        setType("income");
      }
    }
  }

  const parsedAmount = parseFloat(amount.replace(",", ".").replace(/[^0-9.]/g, ""));
  const numInstall   = Math.max(1, parseInt(installments) || 1);
  const canSave      = description.trim().length > 0 && !isNaN(parsedAmount) && parsedAmount > 0 && !!userId;
  const selectedCat  = CATEGORIES.find(c => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];

  async function handleSave() {
    if (!canSave || !userId) return;
    setSaving(true);
    const supabase = createClient();

    const base = {
      user_id:      userId,
      type,
      category_id:  categoryId,
      account_name: accountName || null,
      account_type: accountName ? accountType : null,
    };

    if (numInstall > 1) {
      const groupId = crypto.randomUUID();
      const rows = Array.from({ length: numInstall }, (_, i) => {
        const d = new Date(date + "T12:00:00");
        d.setMonth(d.getMonth() + i);
        return {
          ...base,
          description:          `${description.trim()} (${i + 1}/${numInstall})`,
          amount:               +(parsedAmount / numInstall).toFixed(2),
          date:                 d.toISOString().split("T")[0],
          installments:         numInstall,
          installment_current:  i + 1,
          installment_group_id: groupId,
        };
      });
      await supabase.from("transactions").insert(rows);
    } else {
      await supabase.from("transactions").insert({
        ...base,
        description:         description.trim(),
        amount:              parsedAmount,
        date,
        installments:        1,
        installment_current: 1,
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => { router.push("/home"); router.refresh(); }, 900);
  }

  if (saved) return (
    <main className="flex flex-col min-h-screen items-center justify-center gap-4 safe-bottom">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 28px rgba(244,114,182,0.4)" }}>
        <i className="fa-solid fa-check text-3xl text-white" />
      </div>
      <p className="text-lg font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>Lançado!</p>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Voltando para o início…</p>
    </main>
  );

  return (
    <main className="flex flex-col min-h-screen safe-bottom">

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
        <div>
          <h1 className="font-semibold text-base">Lançar</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Registrar transação</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32 flex flex-col gap-4">

        {/* Tipo */}
        <div className="flex gap-2">
          {(["expense", "income"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all"
              style={{
                background: type === t
                  ? t === "income" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)"
                  : "var(--card)",
                border: type === t
                  ? `1.5px solid ${t === "income" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.35)"}`
                  : "1.5px solid var(--border)",
                color: type === t
                  ? t === "income" ? "var(--income)" : "var(--expense)"
                  : "var(--muted-foreground)",
              }}>
              <i className={`fa-solid ${t === "income" ? "fa-arrow-down" : "fa-arrow-up"} text-xs`} />
              {t === "income" ? "Entrada" : "Saída"}
            </button>
          ))}
        </div>

        {/* Descrição */}
        <div>
          <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>Descrição</p>
          <input
            ref={descRef}
            value={description}
            onChange={e => handleDescChange(e.target.value)}
            placeholder="Ex: Almoço, Gasolina, Netflix…"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          />
          {description.length > 3 && (
            <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: selectedCat.color }}>
              <i className={`fa-solid ${selectedCat.icon}`} />
              Detectado: {selectedCat.name}
            </p>
          )}
        </div>

        {/* Valor + Data */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>Valor (R$)</p>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data"
              style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            />
          </div>
          <div>
            <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>Data</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        {/* Categoria — grid completo, sem scroll horizontal */}
        <div>
          <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>Categoria</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.filter(c => c.id !== "outros").map(c => (
              <button key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all active:scale-95"
                style={{
                  background: categoryId === c.id ? `${c.color}22` : "var(--card)",
                  border: `1.5px solid ${categoryId === c.id ? c.color + "60" : "var(--border)"}`,
                  boxShadow: categoryId === c.id ? `0 0 8px ${c.color}30` : "none",
                }}>
                <i className={`fa-solid ${c.icon} text-base`} style={{ color: c.color }} />
                <span className="text-[9px] text-center leading-tight font-medium"
                  style={{ color: categoryId === c.id ? c.color : "var(--muted-foreground)" }}>
                  {c.name.split(" ")[0]}
                </span>
              </button>
            ))}
            {/* Outros */}
            <button
              onClick={() => setCategoryId("outros")}
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all active:scale-95"
              style={{
                background: categoryId === "outros" ? "rgba(100,116,139,0.15)" : "var(--card)",
                border: `1.5px solid ${categoryId === "outros" ? "rgba(100,116,139,0.5)" : "var(--border)"}`,
              }}>
              <i className="fa-solid fa-ellipsis text-base" style={{ color: "#64748B" }} />
              <span className="text-[9px] font-medium" style={{ color: "var(--muted-foreground)" }}>Outros</span>
            </button>
          </div>
        </div>

        {/* Conta (opcional) */}
        {accounts.length > 0 && (
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Conta / Cartão <span className="font-normal opacity-60">(opcional)</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setAccountName("")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: !accountName ? "rgba(244,114,182,0.12)" : "var(--card)",
                  border: `1px solid ${!accountName ? "rgba(244,114,182,0.35)" : "var(--border)"}`,
                  color: !accountName ? "var(--primary)" : "var(--muted-foreground)",
                }}>
                Nenhuma
              </button>
              {accounts.map(acc => {
                const isCC = acc.type === "credit_card";
                const sel  = accountName === acc.name;
                return (
                  <button key={acc.name}
                    onClick={() => { setAccountName(acc.name); setAccountType(acc.type as "credit_card" | "checking"); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: sel ? (isCC ? "rgba(244,114,182,0.12)" : "rgba(99,102,241,0.12)") : "var(--card)",
                      border: `1px solid ${sel ? (isCC ? "rgba(244,114,182,0.35)" : "rgba(99,102,241,0.35)") : "var(--border)"}`,
                      color: sel ? (isCC ? "var(--primary)" : "#6366F1") : "var(--muted-foreground)",
                    }}>
                    <i className={`fa-solid ${isCC ? "fa-credit-card" : "fa-building-columns"} text-[9px]`} />
                    {acc.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Parcelamento */}
        <div>
          <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
            Parcelamento <span className="font-normal opacity-60">(opcional)</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {["1","2","3","4","6","8","10","12","18","24"].map(n => (
              <button key={n}
                onClick={() => setInstallments(n)}
                className="w-11 h-10 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: installments === n ? "var(--primary)" : "var(--card)",
                  border: `1px solid ${installments === n ? "var(--primary)" : "var(--border)"}`,
                  color: installments === n ? "#fff" : "var(--muted-foreground)",
                  boxShadow: installments === n ? "0 0 10px rgba(244,114,182,0.35)" : "none",
                }}>
                {n === "1" ? "1x" : `${n}x`}
              </button>
            ))}
          </div>
          {numInstall > 1 && !isNaN(parsedAmount) && parsedAmount > 0 && (
            <p className="text-[10px] mt-1.5 mono-data" style={{ color: "var(--muted-foreground)" }}>
              {numInstall}x de R$ {(parsedAmount / numInstall).toFixed(2).replace(".", ",")} · Total R$ {parsedAmount.toFixed(2).replace(".", ",")}
            </p>
          )}
        </div>

      </div>

      {/* Botão fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 z-40"
        style={{
          background: "var(--background)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 4.5rem)",
        }}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-40 transition-all">
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Salvando…</>
            : <><i className="fa-solid fa-check mr-2" />Confirmar lançamento</>}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
