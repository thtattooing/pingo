"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, detectCategory } from "@/lib/categories";
import { BRL } from "@/lib/formatters";

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24];

interface Props {
  cardName: string;
  cardType?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddToCardModal({ cardName, cardType = "credit_card", onClose, onSaved }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount]           = useState("");
  const [parcelas, setParcelas]       = useState(1);
  const [categoryId, setCategoryId]   = useState("outros");
  const [date, setDate]               = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving]           = useState(false);

  function handleDescChange(v: string) {
    setDescription(v);
    if (v.length > 3) setCategoryId(detectCategory(v));
  }

  async function handleSave() {
    if (!description || !amount) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const totalAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(totalAmount) || totalAmount <= 0) { setSaving(false); return; }

    const groupId = crypto.randomUUID();
    const installmentValue = +(totalAmount / parcelas).toFixed(2);

    const rows = Array.from({ length: parcelas }, (_, idx) => {
      const d = new Date(date + "T12:00:00");
      d.setMonth(d.getMonth() + idx);
      return {
        user_id:               user.id,
        description:           parcelas > 1 ? `${description} (${idx + 1}/${parcelas})` : description,
        amount:                installmentValue,
        type:                  "expense",
        category_id:           categoryId,
        date:                  d.toISOString().split("T")[0],
        account_name:          cardName,
        account_type:          cardType,
        installments:          parcelas,
        installment_current:   idx + 1,
        installment_group_id:  parcelas > 1 ? groupId : null,
        is_imported:           false,
      };
    });

    const { error } = await supabase.from("transactions").insert(rows);
    setSaving(false);
    if (!error) { onSaved(); onClose(); }
  }

  const totalValue = parseFloat(amount.replace(",", "."));
  const installmentValue = !isNaN(totalValue) && totalValue > 0 ? +(totalValue / parcelas).toFixed(2) : 0;
  const cat = CATEGORIES.find(c => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-3xl flex flex-col gap-4 animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "1.25rem", paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Nova compra</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              <i className="fa-solid fa-credit-card mr-1.5" style={{ color: "var(--primary)" }} />
              {cardName}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Description */}
        <input value={description} onChange={e => handleDescChange(e.target.value)}
          placeholder="Onde foi a compra?"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--input)", color: "var(--foreground)" }} />

        {/* Amount */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "var(--input)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>R$</span>
          <input value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0,00" inputMode="decimal"
            className="flex-1 bg-transparent outline-none text-lg font-semibold mono-data"
            style={{ color: "var(--foreground)" }} />
          {installmentValue > 0 && parcelas > 1 && (
            <span className="text-xs mono-data" style={{ color: "var(--muted-foreground)" }}>
              {parcelas}x {BRL(installmentValue)}
            </span>
          )}
        </div>

        {/* Installments */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Parcelas</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {INSTALLMENT_OPTIONS.map(n => (
              <button key={n} onClick={() => setParcelas(n)}
                className="flex-shrink-0 w-10 h-10 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: parcelas === n ? "var(--primary)" : "var(--input)",
                  color:      parcelas === n ? "#fff" : "var(--foreground)",
                  boxShadow:  parcelas === n ? "0 0 12px rgba(244,114,182,0.4)" : "none",
                }}>
                {n}x
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Categoria</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.slice(0, 10).map(c => (
              <button key={c.id} onClick={() => setCategoryId(c.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl flex-shrink-0 transition-all"
                style={{
                  background: categoryId === c.id ? `${c.color}25` : "var(--input)",
                  border:     categoryId === c.id ? `1px solid ${c.color}60` : "1px solid transparent",
                  minWidth: 52,
                }}>
                <i className={`fa-solid ${c.icon} text-sm`} style={{ color: c.color }} />
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Data da compra</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--input)", color: "var(--foreground)" }} />
        </div>

        {/* Preview */}
        {installmentValue > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}30` }}>
            <i className={`fa-solid ${cat.icon} text-sm`} style={{ color: cat.color }} />
            <div className="flex-1">
              <p className="text-xs font-medium">{description || "Compra"}</p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {parcelas > 1 ? `${parcelas}x de ${BRL(installmentValue)} — total ${BRL(totalValue)}` : BRL(totalValue)}
              </p>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !description || !amount}
          className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-40">
          {saving ? "Salvando..." : `Adicionar${parcelas > 1 ? ` ${parcelas}x` : ""}`}
        </button>
      </div>
    </div>
  );
}
