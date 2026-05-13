"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { BRL } from "@/lib/formatters";
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
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").update({
      description,
      amount: parseFloat(amount.replace(",", ".")),
      type,
      category_id: categoryId,
      is_shared: isShared,
    }).eq("id", tx.id);
    setSaving(false);
    if (!error) { onSaved(); onClose(); }
  }

  async function handleDelete() {
    if (!confirm("Excluir esta transação?")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", tx.id);
    setDeleting(false);
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-3xl p-5 flex flex-col gap-4 animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Editar transação</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: "var(--input)" }}>
          {(["expense", "income"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 py-2.5 text-sm font-medium transition-all"
              style={{
                background: type === t ? (t === "income" ? "var(--income)" : "var(--expense)") : "transparent",
                color: type === t ? "#fff" : "var(--muted-foreground)",
                borderRadius: "0.75rem",
              }}>
              {t === "income" ? "Entrada" : "Saída"}
            </button>
          ))}
        </div>

        {/* Description */}
        <input value={description} onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--input)", color: "var(--foreground)" }}
          placeholder="Descrição" />

        {/* Amount */}
        <input value={amount} onChange={e => setAmount(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data"
          style={{ background: "var(--input)", color: "var(--foreground)" }}
          placeholder="Valor" inputMode="decimal" />

        {/* Category */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.slice(0, 10).map(c => (
            <button key={c.id} onClick={() => setCategoryId(c.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl flex-shrink-0 transition-all"
              style={{
                background: categoryId === c.id ? `${c.color}25` : "var(--input)",
                border: categoryId === c.id ? `1px solid ${c.color}60` : "1px solid transparent",
                minWidth: 56,
              }}>
              <i className={`fa-solid ${c.icon} text-sm`} style={{ color: c.color }} />
              <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Shared toggle */}
        <button onClick={() => setIsShared(v => !v)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
          style={{ background: isShared ? "rgba(244,114,182,0.12)" : "var(--input)", border: isShared ? "1px solid rgba(244,114,182,0.3)" : "1px solid transparent" }}>
          <i className="fa-solid fa-heart text-sm" style={{ color: isShared ? "var(--primary)" : "var(--muted-foreground)" }} />
          <span className="text-sm flex-1 text-left">Despesa do casal</span>
          <div className="w-10 h-5 rounded-full relative transition-all"
            style={{ background: isShared ? "var(--primary)" : "var(--muted)" }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: isShared ? "calc(100% - 1.125rem)" : "0.125rem" }} />
          </div>
        </button>

        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-3.5 rounded-2xl text-sm font-medium transition-all"
            style={{ background: "rgba(239,68,68,0.12)", color: "var(--expense)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {deleting ? "..." : <><i className="fa-solid fa-trash-can mr-2" />Excluir</>}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold btn-primary">
            {saving ? "..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
