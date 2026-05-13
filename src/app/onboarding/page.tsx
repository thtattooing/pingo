"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  {
    icon: "fa-piggy-bank",
    title: "Bem-vindo ao PINGO!",
    desc: "Cada pingo conta. Vamos configurar seu perfil financeiro.",
    color: "#F472B6",
  },
  {
    icon: "fa-money-bill-wave",
    title: "Qual sua renda mensal?",
    desc: "Usaremos para calcular seu orçamento 50/30/20.",
    color: "#10B981",
  },
  {
    icon: "fa-shield-halved",
    title: "Reserva de emergência",
    desc: "Quantos meses de gastos você quer guardar como reserva?",
    color: "#FBBF24",
  },
];

export default function OnboardingPage() {
  const [step, setStep]         = useState(0);
  const [income, setIncome]     = useState("");
  const [months, setMonths]     = useState("6");
  const [saving, setSaving]     = useState(false);
  const router                  = useRouter();

  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Ensure profile exists
      await supabase.from("profiles").upsert({ id: user.id });
      // Save settings
      await supabase.from("user_settings").upsert({
        user_id: user.id,
        monthly_income_goal: parseFloat(income.replace(",", ".")) || 0,
        emergency_fund_months: parseInt(months) || 6,
      });
    }
    setSaving(false);
    router.push("/");
    router.refresh();
  }

  const s = STEPS[step];

  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6 py-10">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className="rounded-full transition-all"
            style={{
              width: i === step ? 24 : 8, height: 8,
              background: i <= step ? "var(--primary)" : "var(--muted)",
            }} />
        ))}
      </div>

      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-coin-drop"
        style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
        <i className={`fa-solid ${s.icon} text-3xl`} style={{ color: s.color }} />
      </div>

      <h1 className="text-2xl font-normal text-center mb-2" style={{ fontFamily: "var(--font-calistoga)" }}>
        {s.title}
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--muted-foreground)" }}>
        {s.desc}
      </p>

      {/* Step 0 — just welcome */}
      {step === 0 && (
        <div className="w-full flex flex-col gap-4">
          <div className="card-pingo flex flex-col gap-2">
            {["Lançamento por texto natural", "Importação de extratos CSV/OFX", "Análise com IA", "Metas e orçamento 50/30/20"].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(244,114,182,0.15)" }}>
                  <i className="fa-solid fa-check text-xs" style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — income */}
      {step === 1 && (
        <div className="w-full">
          <div className="flex items-center gap-2 px-4 py-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <span className="text-base font-semibold" style={{ color: "var(--muted-foreground)" }}>R$</span>
            <input value={income} onChange={e => setIncome(e.target.value)}
              className="flex-1 bg-transparent outline-none text-2xl font-semibold mono-data"
              placeholder="0,00" inputMode="decimal"
              style={{ color: "var(--foreground)" }} />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: "var(--muted-foreground)" }}>
            Pode alterar isso depois em Metas &gt; Orçamento
          </p>
        </div>
      )}

      {/* Step 2 — emergency fund months */}
      {step === 2 && (
        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap justify-center">
            {[3, 6, 9, 12].map(m => (
              <button key={m} onClick={() => setMonths(String(m))}
                className="px-6 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: months === String(m) ? "var(--gold)" : "var(--card)",
                  color: months === String(m) ? "#100A18" : "var(--foreground)",
                  border: months === String(m) ? "none" : "1px solid var(--border)",
                }}>
                {m} meses
              </button>
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            Especialistas recomendam de 3 a 6 meses
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 w-full mt-10">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-4 rounded-2xl text-sm font-medium"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="flex-1 py-4 rounded-2xl text-sm font-semibold btn-primary">
            Continuar
          </button>
        ) : (
          <button onClick={handleFinish} disabled={saving} className="flex-1 py-4 rounded-2xl text-sm font-semibold btn-primary">
            {saving ? "Configurando..." : "Começar a usar"}
          </button>
        )}
      </div>
    </main>
  );
}
