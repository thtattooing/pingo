"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRL } from "@/lib/formatters";

interface Account {
  name: string;
  color: string;
  type: string;
}

export default function TransferModal({
  accounts,
  onClose,
  onSaved,
}: {
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const checkingAccounts = accounts.filter(a => a.type !== "credit_card");

  const [fromName, setFromName] = useState(checkingAccounts[0]?.name ?? accounts[0]?.name ?? "");
  const [toName, setToName] = useState(
    accounts.find(a => a.name !== (checkingAccounts[0]?.name ?? ""))?.name ?? ""
  );
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(new Date().toISOString().split("T")[0]);
  const [description, setDesc]  = useState("Transferência entre contas");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const validAmount = parseFloat(amount.replace(",", ".")) || 0;
  const canSave = !!fromName && !!toName && fromName !== toName && validAmount > 0;

  const fromAccount = accounts.find(a => a.name === fromName);
  const toAccount   = accounts.find(a => a.name === toName);
  const toOptions   = accounts.filter(a => a.name !== fromName);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: err } = await supabase.from("transactions").insert([
      {
        user_id:      user.id,
        account_name: fromName,
        account_type: fromAccount?.type ?? "checking",
        type:         "expense",
        amount:       validAmount,
        date,
        description,
        tx_type:      "transfer_internal",
        category_id:  null,
        is_imported:  false,
      },
      {
        user_id:      user.id,
        account_name: toName,
        account_type: toAccount?.type ?? "checking",
        type:         "income",
        amount:       validAmount,
        date,
        description,
        tx_type:      "transfer_internal",
        category_id:  null,
        is_imported:  false,
      },
    ]);

    setSaving(false);
    if (err) { setError("Erro ao salvar. Tente novamente."); return; }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl flex flex-col animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", maxHeight: "92dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base">Transferência</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Entre contas e cartões
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-4">
          {/* Amount */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Valor</p>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-lg font-bold outline-none mono-data"
              style={{ background: "var(--input)", color: "var(--foreground)" }}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>

          {/* From / Arrow / To */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>De</p>
              <select
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--input)", color: "var(--foreground)" }}
              >
                {checkingAccounts.map(a => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-3 flex-shrink-0">
              <i className="fa-solid fa-right-left text-sm" style={{ color: "var(--muted-foreground)" }} />
            </div>

            <div className="flex-1">
              <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Para</p>
              <select
                value={toName}
                onChange={e => setToName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--input)", color: "var(--foreground)" }}
              >
                {toOptions.map(a => (
                  <option key={a.name} value={a.name}>
                    {a.name}{a.type === "credit_card" ? " (cartão)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Data</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--input)", color: "var(--foreground)" }}
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Descrição</p>
            <input
              value={description}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--input)", color: "var(--foreground)" }}
            />
          </div>

          {/* Preview */}
          {validAmount > 0 && fromName && toName && fromName !== toName && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "#6366F1" }}>
                <i className="fa-solid fa-circle-info mr-1.5" />
                Resumo
              </p>
              <p className="text-xs" style={{ color: "var(--foreground)" }}>
                {BRL(validAmount)} saindo de <strong>{fromName}</strong> e entrando em <strong>{toName}</strong>
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                Registrado como transferência interna — não afeta relatórios de gastos
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-center" style={{ color: "var(--expense)" }}>{error}</p>
          )}
        </div>

        {/* Fixed save button */}
        <div
          className="px-5 pt-3 flex-shrink-0"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary"
            style={{ opacity: canSave ? 1 : 0.5 }}
          >
            {saving ? "Salvando..." : "Confirmar transferência"}
          </button>
        </div>
      </div>
    </div>
  );
}
