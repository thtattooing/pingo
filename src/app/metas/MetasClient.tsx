"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRL } from "@/lib/formatters";

// -------- Types --------
interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon: string;
  color: string;
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  purchased_at: string;
  notes?: string;
}

interface BudgetData {
  income: number;
  necessities: number;
  wants: number;
  savings: number;
  emergencyMonths: number;
  monthlyExpense: number;
}

// -------- Investment types --------
const INVEST_TYPES = [
  { id: "renda_fixa", label: "Renda Fixa", icon: "fa-shield-halved", color: "#10B981" },
  { id: "acoes",      label: "Ações",      icon: "fa-chart-line",    color: "#6366F1" },
  { id: "cripto",     label: "Cripto",     icon: "fa-bitcoin-sign",  color: "#FBBF24" },
  { id: "imovel",     label: "Imóvel",     icon: "fa-house",         color: "#8B5CF6" },
  { id: "fundo",      label: "Fundos",     icon: "fa-briefcase",     color: "#F97316" },
  { id: "outro",      label: "Outro",      icon: "fa-ellipsis",      color: "#64748B" },
];

const GOAL_ICONS = ["fa-piggy-bank","fa-house","fa-car","fa-plane","fa-graduation-cap","fa-heart","fa-ring","fa-laptop","fa-mobile"];
const GOAL_COLORS = ["#F472B6","#A78BFA","#60A5FA","#34D399","#FBBF24","#F97316","#EC4899"];

// -------- Modals --------
function SavingsGoalModal({ existing, onClose, onSaved }: {
  existing?: SavingsGoal; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName]       = useState(existing?.name ?? "");
  const [target, setTarget]   = useState(String(existing?.target_amount ?? ""));
  const [current, setCurrent] = useState(String(existing?.current_amount ?? "0"));
  const [deadline, setDeadline] = useState(existing?.deadline ?? "");
  const [icon, setIcon]       = useState(existing?.icon ?? "fa-piggy-bank");
  const [color, setColor]     = useState(existing?.color ?? "#F472B6");
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!name || !target) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id, name,
      target_amount: parseFloat(target.replace(",", ".")),
      current_amount: parseFloat(current.replace(",", ".")) || 0,
      deadline: deadline || null, icon, color,
    };
    if (existing?.id) {
      await supabase.from("savings_goals").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("savings_goals").insert(payload);
    }
    setSaving(false); onSaved(); onClose();
  }

  async function handleDelete() {
    if (!existing?.id || !confirm("Excluir esta meta?")) return;
    const supabase = createClient();
    await supabase.from("savings_goals").delete().eq("id", existing.id);
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-3xl p-5 flex flex-col gap-4 animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{existing ? "Editar meta" : "Nova meta"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da meta"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--input)" }} />

        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Valor alvo (R$)</p>
            <input value={target} onChange={e => setTarget(e.target.value)} placeholder="0"
              inputMode="decimal" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mono-data"
              style={{ background: "var(--input)" }} />
          </div>
          <div className="flex-1">
            <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Já tenho (R$)</p>
            <input value={current} onChange={e => setCurrent(e.target.value)} placeholder="0"
              inputMode="decimal" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mono-data"
              style={{ background: "var(--input)" }} />
          </div>
        </div>

        <div>
          <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Prazo (opcional)</p>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--input)" }} />
        </div>

        <div>
          <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Ícone</p>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {GOAL_ICONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: icon === ic ? `${color}25` : "var(--input)", border: icon === ic ? `1px solid ${color}60` : "1px solid transparent" }}>
                <i className={`fa-solid ${ic} text-sm`} style={{ color: icon === ic ? color : "var(--muted-foreground)" }} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Cor</p>
          <div className="flex gap-3">
            {GOAL_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all"
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px rgba(255,255,255,0.3), 0 0 0 4px ${c}` : "none", transform: color === c ? "scale(1.2)" : "scale(1)" }} />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {existing && (
            <button onClick={handleDelete} className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.12)", color: "var(--expense)" }}>
              <i className="fa-solid fa-trash-can mr-2" />Excluir
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className={`${existing ? "flex-1" : "w-full"} py-3.5 rounded-2xl text-sm font-semibold btn-primary`}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvestmentModal({ existing, onClose, onSaved }: {
  existing?: Investment; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName]   = useState(existing?.name ?? "");
  const [type, setType]   = useState(existing?.type ?? "renda_fixa");
  const [amount, setAmount] = useState(String(existing?.amount ?? ""));
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name || !amount) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = { user_id: user.id, name, type, amount: parseFloat(amount.replace(",", ".")), notes };
    if (existing?.id) {
      await supabase.from("investments").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("investments").insert(payload);
    }
    setSaving(false); onSaved(); onClose();
  }

  async function handleDelete() {
    if (!existing?.id || !confirm("Excluir este investimento?")) return;
    const supabase = createClient();
    await supabase.from("investments").delete().eq("id", existing.id);
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-3xl p-5 flex flex-col gap-4 animate-fade-in-up"
        style={{ background: "var(--card)", border: "1px solid var(--border)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{existing ? "Editar investimento" : "Novo investimento"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do investimento"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--input)" }} />

        <div className="flex gap-2 flex-wrap">
          {INVEST_TYPES.map(it => (
            <button key={it.id} onClick={() => setType(it.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
              style={{ background: type === it.id ? `${it.color}20` : "var(--input)", border: type === it.id ? `1px solid ${it.color}50` : "1px solid transparent", color: type === it.id ? it.color : "var(--muted-foreground)" }}>
              <i className={`fa-solid ${it.icon}`} />
              {it.label}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Valor investido (R$)</p>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
            inputMode="decimal" className="w-full px-4 py-3 rounded-xl text-sm outline-none mono-data"
            style={{ background: "var(--input)" }} />
        </div>

        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações (opcional)"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--input)" }} />

        <div className="flex gap-3">
          {existing && (
            <button onClick={handleDelete} className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.12)", color: "var(--expense)" }}>
              <i className="fa-solid fa-trash-can mr-2" />Excluir
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className={`${existing ? "flex-1" : "w-full"} py-3.5 rounded-2xl text-sm font-semibold btn-primary`}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------- Goal Card --------
function GoalCard({ goal, onClick }: { goal: SavingsGoal; onClick: () => void }) {
  const pct = Math.min(goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0, 100);
  const remaining = goal.target_amount - goal.current_amount;
  return (
    <button onClick={onClick} className="card-pingo text-left w-full transition-all active:scale-98">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${goal.color}20` }}>
          <i className={`fa-solid ${goal.icon} text-sm`} style={{ color: goal.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{goal.name}</p>
          <p className="text-xs mono-data" style={{ color: "var(--muted-foreground)" }}>
            {BRL(goal.current_amount)} / {BRL(goal.target_amount)}
          </p>
        </div>
        <span className="text-xs font-bold mono-data" style={{ color: goal.color }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: goal.color }} />
      </div>
      {remaining > 0 && (
        <p className="text-xs mt-1.5 mono-data" style={{ color: "var(--muted-foreground)" }}>
          Faltam {BRL(remaining)}
          {goal.deadline && ` · até ${new Date(goal.deadline + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}`}
        </p>
      )}
    </button>
  );
}

// -------- Main --------
export default function MetasClient({
  initialGoals,
  initialInvestments,
  budget,
  totalInvestments,
  incomeMonth,
}: {
  initialGoals: SavingsGoal[];
  initialInvestments: Investment[];
  budget: BudgetData;
  totalInvestments: number;
  incomeMonth: number;
}) {
  const [tab, setTab]                   = useState<"metas"|"orcamento"|"investimentos">("metas");
  const [goals, setGoals]               = useState(initialGoals);
  const [investments, setInvestments]   = useState(initialInvestments);
  const [goalModal, setGoalModal]       = useState<SavingsGoal | null | "new">(null);
  const [investModal, setInvestModal]   = useState<Investment | null | "new">(null);

  async function reloadGoals() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("savings_goals").select("*").eq("user_id", user.id).order("created_at");
    setGoals(data ?? []);
  }

  async function reloadInvestments() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("investments").select("*").eq("user_id", user.id).order("created_at");
    setInvestments(data ?? []);
  }

  const { income, necessities, wants, savings, emergencyMonths, monthlyExpense } = budget;
  const needsPct   = income > 0 ? (necessities / income) * 100 : 0;
  const wantsPct   = income > 0 ? (wants / income) * 100 : 0;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;
  const emergencyTarget = monthlyExpense * emergencyMonths;
  const emergencyHave   = goals.find(g => g.name.toLowerCase().includes("emergência") || g.name.toLowerCase().includes("reserva"))?.current_amount ?? 0;
  const emergencyPct    = emergencyTarget > 0 ? Math.min((emergencyHave / emergencyTarget) * 100, 100) : 0;

  const investPct = incomeMonth > 0 ? (totalInvestments / incomeMonth) * 100 : 0;

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mx-5 mb-4" style={{ background: "var(--muted)" }}>
        {([
          { id: "metas",        label: "Metas",         icon: "fa-bullseye" },
          { id: "orcamento",    label: "Orçamento",     icon: "fa-chart-pie" },
          { id: "investimentos",label: "Investimentos", icon: "fa-chart-line" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: tab === t.id ? "var(--card)" : "transparent", color: tab === t.id ? "var(--foreground)" : "var(--muted-foreground)" }}>
            <i className={`fa-solid ${t.icon} text-xs`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- METAS TAB ---- */}
      {tab === "metas" && (
        <div className="flex flex-col gap-3 px-5">
          {goals.length === 0 && (
            <div className="card-pingo flex flex-col items-center gap-3 py-10 text-center">
              <i className="fa-solid fa-bullseye text-3xl" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma meta ainda</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Crie metas para suas economias</p>
            </div>
          )}
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onClick={() => setGoalModal(g)} />
          ))}
          <button onClick={() => setGoalModal("new")}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium transition-all"
            style={{ border: "2px dashed var(--border)", color: "var(--muted-foreground)" }}>
            <i className="fa-solid fa-plus" />
            Nova meta
          </button>
        </div>
      )}

      {/* ---- ORÇAMENTO TAB ---- */}
      {tab === "orcamento" && (
        <div className="flex flex-col gap-3 px-5">
          {/* 50/30/20 */}
          <div className="card-pingo">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-chart-pie text-sm" style={{ color: "var(--primary)" }} />
              <h3 className="text-sm font-semibold">Regra 50/30/20</h3>
            </div>
            {income === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Lance entradas para ver o orçamento.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { label: "Necessidades", ideal: 50, actual: needsPct, amount: necessities, color: "#6366F1", desc: "Moradia, alimentação, saúde" },
                  { label: "Desejos",      ideal: 30, actual: wantsPct, amount: wants,        color: "#F472B6", desc: "Lazer, roupas, restaurantes" },
                  { label: "Economias",    ideal: 20, actual: savingsPct, amount: savings,    color: "#10B981", desc: "Reserva, investimentos, metas" },
                ].map(({ label, ideal, actual, amount, color, desc }) => {
                  const over = actual > ideal + 5;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-[10px] ml-2" style={{ color: "var(--muted-foreground)" }}>{desc}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs mono-data font-semibold" style={{ color: over ? "var(--expense)" : color }}>
                            {Math.round(actual)}%
                          </span>
                          <span className="text-[10px] ml-1" style={{ color: "var(--muted-foreground)" }}>/ {ideal}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden relative" style={{ background: "var(--muted)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(actual, 100)}%`, background: over ? "var(--expense)" : color }} />
                        <div className="absolute top-0 h-full border-r-2 border-white/40" style={{ left: `${ideal}%` }} />
                      </div>
                      <p className="text-xs mt-0.5 mono-data" style={{ color: "var(--muted-foreground)" }}>
                        {BRL(amount)} de {BRL(income * ideal / 100)} ideal
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emergency Fund */}
          <div className="card-pingo">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-shield-halved text-sm" style={{ color: "#FBBF24" }} />
              <h3 className="text-sm font-semibold">Reserva de emergência</h3>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
              Meta: {emergencyMonths} meses de gastos = {BRL(emergencyTarget)}
            </p>
            <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${emergencyPct}%`, background: emergencyPct >= 100 ? "#10B981" : "#FBBF24" }} />
            </div>
            <div className="flex justify-between text-xs mono-data">
              <span style={{ color: "var(--muted-foreground)" }}>{BRL(emergencyHave)} guardados</span>
              <span style={{ color: emergencyPct >= 100 ? "var(--income)" : "var(--gold)" }}>
                {Math.round(emergencyPct)}% {emergencyPct >= 100 ? "✓" : ""}
              </span>
            </div>
            {emergencyHave === 0 && (
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                Crie uma meta chamada "Reserva de emergência" para acompanhar aqui.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---- INVESTIMENTOS TAB ---- */}
      {tab === "investimentos" && (
        <div className="flex flex-col gap-3 px-5">
          {/* Summary */}
          <div className="card-pingo">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-sm" style={{ color: "#6366F1" }} />
                <span className="text-sm font-semibold">Patrimônio investido</span>
              </div>
              <span className="text-xs mono-data" style={{ color: "var(--muted-foreground)" }}>
                {Math.round(investPct)}% da renda mensal
              </span>
            </div>
            <p className="text-2xl font-semibold mono-data" style={{ color: "#6366F1" }}>
              {BRL(totalInvestments)}
            </p>
            {/* Breakdown by type */}
            {investments.length > 0 && (() => {
              const byType = new Map<string, number>();
              investments.forEach(inv => byType.set(inv.type, (byType.get(inv.type) ?? 0) + inv.amount));
              const total = Array.from(byType.values()).reduce((s, v) => s + v, 0);
              return (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {Array.from(byType.entries()).map(([t, v]) => {
                    const it = INVEST_TYPES.find(x => x.id === t) ?? INVEST_TYPES[INVEST_TYPES.length - 1];
                    return (
                      <div key={t} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: `${it.color}15`, color: it.color }}>
                        <i className={`fa-solid ${it.icon}`} style={{ fontSize: 10 }} />
                        {it.label}: {Math.round((v / total) * 100)}%
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {investments.length === 0 && (
            <div className="card-pingo flex flex-col items-center gap-3 py-8 text-center">
              <i className="fa-solid fa-chart-line text-3xl" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum investimento registrado</p>
            </div>
          )}

          {investments.map(inv => {
            const it = INVEST_TYPES.find(x => x.id === inv.type) ?? INVEST_TYPES[INVEST_TYPES.length - 1];
            return (
              <button key={inv.id} onClick={() => setInvestModal(inv)}
                className="card-pingo text-left flex items-center gap-3 w-full transition-all active:scale-98">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${it.color}20` }}>
                  <i className={`fa-solid ${it.icon} text-sm`} style={{ color: it.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{inv.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{it.label}</p>
                </div>
                <span className="text-sm font-semibold mono-data" style={{ color: it.color }}>
                  {BRL(inv.amount)}
                </span>
              </button>
            );
          })}

          <button onClick={() => setInvestModal("new")}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium"
            style={{ border: "2px dashed var(--border)", color: "var(--muted-foreground)" }}>
            <i className="fa-solid fa-plus" />
            Adicionar investimento
          </button>
        </div>
      )}

      {/* Modals */}
      {goalModal && (
        <SavingsGoalModal
          existing={goalModal === "new" ? undefined : goalModal}
          onClose={() => setGoalModal(null)}
          onSaved={reloadGoals}
        />
      )}
      {investModal && (
        <InvestmentModal
          existing={investModal === "new" ? undefined : investModal}
          onClose={() => setInvestModal(null)}
          onSaved={reloadInvestments}
        />
      )}
    </>
  );
}
