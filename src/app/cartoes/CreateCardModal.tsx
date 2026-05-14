"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRL } from "@/lib/formatters";

const BRANDS = [
  { id: "visa",       label: "Visa"       },
  { id: "mastercard", label: "Master"     },
  { id: "elo",        label: "Elo"        },
  { id: "amex",       label: "Amex"       },
  { id: "hipercard",  label: "Hipercard"  },
];

const CARD_COLORS = [
  "#F472B6","#A78BFA","#60A5FA","#34D399",
  "#FBBF24","#F97316","#EC4899","#06B6D4",
  "#8B5CF6","#10B981",
];

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function CreateCardModal({ onClose, onSaved }: Props) {
  const [cardType,   setCardType]   = useState<"credit_card" | "checking">("credit_card");
  const [name,       setName]       = useState("");
  const [brand,      setBrand]      = useState("visa");
  const [limit,      setLimit]      = useState("");
  const [dueDay,     setDueDay]     = useState("");
  const [closingDay, setClosingDay] = useState("20");
  const [color,      setColor]      = useState("#F472B6");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const isCredit = cardType === "credit_card";
  const gradBg   = `linear-gradient(135deg, ${color}cc 0%, ${color} 100%)`;

  async function handleSave() {
    if (!name.trim()) { setError("Informe o nome do cartão"); return; }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: err } = await supabase.from("card_settings").upsert({
      user_id:      user.id,
      account_name: name.trim(),
      brand:        isCredit ? brand : null,
      account_type: cardType,
      credit_limit: isCredit ? (parseFloat(limit.replace(",", ".")) || 0) : 0,
      due_day:      isCredit ? (parseInt(dueDay) || 0) : 0,
      closing_day:  isCredit ? (parseInt(closingDay) || 20) : 0,
      color,
    }, { onConflict: "user_id,account_name" });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl flex flex-col gap-5 animate-fade-in-up overflow-y-auto"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
          maxHeight: "94vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Novo cartão</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Crie o cartão e depois importe a fatura
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Card preview */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: gradBg, minHeight: 120 }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{ background: "radial-gradient(ellipse at 80% 15%, #fff 0%, transparent 55%)" }}
          />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                {isCredit ? "Crédito" : "Conta Corrente"}
              </p>
              <p className="text-white font-bold text-lg leading-tight">
                {name || "Meu Cartão"}
              </p>
            </div>
            <i
              className={`fa-solid ${isCredit ? "fa-credit-card" : "fa-building-columns"} text-white/40 text-2xl`}
            />
          </div>
          <div className="relative z-10 flex items-end justify-between">
            {isCredit && limit ? (
              <p className="text-white/60 text-xs mono-data">
                Limite {BRL(parseFloat(limit.replace(",", ".")) || 0)}
              </p>
            ) : <span />}
            {isCredit && (
              <span className="text-white/50 text-[10px] font-bold tracking-widest uppercase">
                {BRANDS.find(b => b.id === brand)?.label ?? "VISA"}
              </span>
            )}
          </div>
        </div>

        {/* Tipo */}
        <div className="flex gap-2">
          {([
            { id: "credit_card", label: "Cartão de crédito", icon: "fa-credit-card" },
            { id: "checking",    label: "Conta corrente",    icon: "fa-building-columns" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => {
                setCardType(t.id);
                setColor(t.id === "credit_card" ? "#F472B6" : "#8B5CF6");
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: cardType === t.id ? `${color}20` : "var(--input)",
                border: `1.5px solid ${cardType === t.id ? color : "transparent"}`,
                color: cardType === t.id ? color : "var(--muted-foreground)",
              }}
            >
              <i className={`fa-solid ${t.icon} text-xs`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Nome */}
        <div>
          <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>
            Nome
          </p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isCredit ? "Ex: Nubank, Inter Gold, C6..." : "Ex: Nubank Conta, Inter..."}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--input)", color: "var(--foreground)" }}
            autoFocus
          />
        </div>

        {/* Bandeira — só crédito */}
        {isCredit && (
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Bandeira
            </p>
            <div className="flex gap-2 flex-wrap">
              {BRANDS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBrand(b.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: brand === b.id ? `${color}20` : "var(--input)",
                    border: `1.5px solid ${brand === b.id ? color : "transparent"}`,
                    color: brand === b.id ? color : "var(--muted-foreground)",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dia de vencimento — só crédito */}
        {isCredit && (
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Vencimento
            </p>
            <div className="flex gap-2 flex-wrap">
              {[1, 5, 7, 10, 12, 15, 20, 25, 28].map(d => (
                <button
                  key={d}
                  onClick={() => setDueDay(String(d))}
                  className="w-11 h-10 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: dueDay === String(d) ? color : "var(--input)",
                    color: dueDay === String(d) ? "#fff" : "var(--foreground)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dia de fechamento — só crédito */}
        {isCredit && (
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Fechamento da fatura
            </p>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 12, 15, 17, 20, 22, 25].map(d => (
                <button
                  key={d}
                  onClick={() => setClosingDay(String(d))}
                  className="w-11 h-10 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: closingDay === String(d) ? "#6366F1" : "var(--input)",
                    color: closingDay === String(d) ? "#fff" : "var(--foreground)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Limite — só crédito */}
        {isCredit && (
          <div>
            <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Limite (opcional)
            </p>
            <input
              value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="Ex: 5000"
              inputMode="decimal"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data"
              style={{ background: "var(--input)", color: "var(--foreground)" }}
            />
          </div>
        )}

        {/* Cor */}
        <div>
          <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
            Cor
          </p>
          <div className="flex gap-3 flex-wrap">
            {CARD_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 3px rgba(255,255,255,0.25), 0 0 0 5px ${c}` : "none",
                  transform: color === c ? "scale(1.25)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p
            className="text-xs px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--expense)" }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-40"
        >
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Criando...</>
            : <><i className="fa-solid fa-plus mr-2" />Criar cartão</>}
        </button>
      </div>
    </div>
  );
}
