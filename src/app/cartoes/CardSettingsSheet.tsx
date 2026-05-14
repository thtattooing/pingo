"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRL } from "@/lib/formatters";

interface CardSetting {
  account_name: string;
  credit_limit: number;
  due_day: number;
  closing_day: number;
  color: string;
  brand?: string;
  account_type?: string;
  interest_rate?: number;
}

const CARD_COLORS = ["#F472B6","#A78BFA","#60A5FA","#34D399","#FBBF24","#F97316","#EC4899","#06B6D4"];
const BRANDS = [
  { id: "visa", label: "Visa" }, { id: "mastercard", label: "Master" },
  { id: "elo",  label: "Elo"  }, { id: "amex",       label: "Amex"   },
  { id: "hipercard", label: "Hipercard" },
];

export default function CardSettingsSheet({
  accountName,
  accountType,
  existing,
  onClose,
  onSaved,
}: {
  accountName: string;
  accountType?: string;
  existing?: CardSetting;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [limit,      setLimit]      = useState(String(existing?.credit_limit  ?? ""));
  const [dueDay,     setDueDay]     = useState(String(existing?.due_day       ?? ""));
  const [closingDay, setClosingDay] = useState(String(existing?.closing_day   ?? "20"));
  const [rate,       setRate]       = useState(String(existing?.interest_rate ?? ""));
  const [color,      setColor]      = useState(existing?.color ?? "#F472B6");
  const [brand,      setBrand]      = useState(existing?.brand ?? "visa");
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const resolvedType = accountType ?? existing?.account_type ?? "credit_card";
    const parsedRate = parseFloat(rate.replace(",", "."));
    const payload = {
      credit_limit:  parseFloat(limit.replace(",", ".")) || 0,
      due_day:       parseInt(dueDay)     || 0,
      closing_day:   parseInt(closingDay) || 20,
      interest_rate: isNaN(parsedRate) ? null : parsedRate,
      color,
      brand,
    };

    await Promise.all([
      supabase.from("card_settings").upsert({
        user_id:      user.id,
        account_name: accountName,
        account_type: resolvedType,
        ...payload,
      }, { onConflict: "user_id,account_name" }),

      supabase.from("accounts").upsert({
        user_id: user.id,
        name:    accountName,
        type:    resolvedType,
        ...payload,
      }, { onConflict: "user_id,name" }),
    ]);

    setSaving(false);
    onSaved();
    onClose();
  }

  const gradBg = `linear-gradient(135deg, ${color}bb 0%, ${color} 100%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-3xl flex flex-col animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", maxHeight: "92dvh" }}>

        {/* Header — fixo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base">Configurar cartão</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{accountName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Conteúdo — scrollável */}
        <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-4 pb-2">

          {/* Preview mini-card */}
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: gradBg, height: 80 }}>
            <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)" }} />
            <p className="text-white font-bold relative z-10">{accountName}</p>
            {limit && !isNaN(parseFloat(limit)) && (
              <p className="text-white/60 text-xs relative z-10 mono-data">{BRL(parseFloat(limit.replace(",", ".")))} limite</p>
            )}
          </div>

          {/* Limit */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Limite do cartão (opcional)</p>
            <input value={limit} onChange={e => setLimit(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data"
              style={{ background: "var(--input)", color: "var(--foreground)" }}
              placeholder="Ex: 5000" inputMode="decimal" />
          </div>

          {/* Interest rate */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Taxa de juros rotativo
              <span className="ml-1 opacity-60">(% ao mês — opcional, para estratégia de dívida)</span>
            </p>
            <div className="relative">
              <input value={rate} onChange={e => setRate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data pr-12"
                style={{ background: "var(--input)", color: "var(--foreground)" }}
                placeholder="Ex: 4.5" inputMode="decimal" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
                style={{ color: "var(--muted-foreground)" }}>%/mês</span>
            </div>
            {rate && !isNaN(parseFloat(rate.replace(",", "."))) && (
              <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                {(parseFloat(rate.replace(",", ".")) * 12).toFixed(1)}% ao ano
                · Nubank ~{" "}13%/mês · Médio BR ~{" "}14%/mês
              </p>
            )}
          </div>

          {/* Due day */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Dia do vencimento</p>
            <div className="flex gap-2 flex-wrap">
              {[1,5,7,10,12,15,20,25,28].map(d => (
                <button key={d} onClick={() => setDueDay(String(d))}
                  className="w-11 h-10 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: dueDay === String(d) ? "var(--primary)" : "var(--input)",
                    color:      dueDay === String(d) ? "#fff" : "var(--foreground)",
                    boxShadow:  dueDay === String(d) ? "0 0 10px rgba(244,114,182,0.4)" : "none",
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Closing day */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Dia de fechamento da fatura
              <span className="ml-1 opacity-60">(compras depois deste dia vão para próxima fatura)</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {[5,10,12,15,17,20,22,25].map(d => (
                <button key={d} onClick={() => setClosingDay(String(d))}
                  className="w-11 h-10 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: closingDay === String(d) ? "#6366F1" : "var(--input)",
                    color:      closingDay === String(d) ? "#fff" : "var(--foreground)",
                  }}>
                  {d}
                </button>
              ))}
            </div>
            {dueDay && closingDay && (
              <p className="text-[10px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                Compras entre dia {closingDay} e {dueDay} do mês seguinte entram nesta fatura
              </p>
            )}
          </div>

          {/* Brand */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Bandeira</p>
            <div className="flex gap-2 flex-wrap">
              {BRANDS.map(b => (
                <button key={b.id} onClick={() => setBrand(b.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: brand === b.id ? "rgba(244,114,182,0.15)" : "var(--input)",
                    border: `1.5px solid ${brand === b.id ? "var(--primary)" : "transparent"}`,
                    color: brand === b.id ? "var(--primary)" : "var(--muted-foreground)",
                  }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Cor do cartão</p>
            <div className="flex gap-3 flex-wrap">
              {CARD_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background:  c,
                    boxShadow:   color === c ? `0 0 0 3px rgba(255,255,255,0.3), 0 0 0 5px ${c}` : "none",
                    transform:   color === c ? "scale(1.25)" : "scale(1)",
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* Botão salvar — fixo na base, sempre visível */}
        <div className="px-5 pt-3 flex-shrink-0"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary">
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}
