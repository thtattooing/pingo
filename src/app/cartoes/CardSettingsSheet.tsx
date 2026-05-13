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
}

const CARD_COLORS = ["#F472B6","#A78BFA","#60A5FA","#34D399","#FBBF24","#F97316","#EC4899","#06B6D4"];

export default function CardSettingsSheet({
  accountName,
  existing,
  onClose,
  onSaved,
}: {
  accountName: string;
  existing?: CardSetting;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [limit,      setLimit]      = useState(String(existing?.credit_limit ?? ""));
  const [dueDay,     setDueDay]     = useState(String(existing?.due_day      ?? ""));
  const [closingDay, setClosingDay] = useState(String(existing?.closing_day  ?? "20"));
  const [color,      setColor]      = useState(existing?.color ?? "#F472B6");
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("card_settings").upsert({
      user_id:     user.id,
      account_name: accountName,
      credit_limit: parseFloat(limit.replace(",", ".")) || 0,
      due_day:      parseInt(dueDay)     || 0,
      closing_day:  parseInt(closingDay) || 20,
      color,
    }, { onConflict: "user_id,account_name" });

    setSaving(false);
    onSaved();
    onClose();
  }

  const gradBg = `linear-gradient(135deg, ${color}bb 0%, ${color} 100%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-3xl flex flex-col gap-4 animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "1.25rem", paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Configurar cartão</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{accountName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

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

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary">
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}
