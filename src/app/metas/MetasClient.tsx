"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRL } from "@/lib/formatters";
import { CATEGORIES } from "@/lib/categories";

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
  healthScore,
  healthDimensions,
  creditUtilPct,
  emergencyPct,
  savingsRatePct,
  catSpend,
  monthGoals: initialMonthGoals,
  curMonth,
  curYear,
}: {
  initialGoals: SavingsGoal[];
  initialInvestments: Investment[];
  budget: BudgetData;
  totalInvestments: number;
  incomeMonth: number;
  healthScore: number;
  healthDimensions: { savings: number; credit: number; emergency: number; invest: number; budget: number };
  creditUtilPct: number;
  emergencyPct: number;
  savingsRatePct: number;
  catSpend: Record<string, number>;
  monthGoals: Record<string, number>;
  curMonth: number;
  curYear: number;
}) {
  const [tab, setTab]                   = useState<"metas"|"orcamento"|"investimentos"|"saude">("metas");
  const [monthGoals, setMonthGoals]     = useState(initialMonthGoals);
  const [editingCat, setEditingCat]     = useState<string | null>(null);
  const [editVal, setEditVal]           = useState("");
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

  async function saveEnvelope(catId: string) {
    const parsed = parseFloat(editVal.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) { setEditingCat(null); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEditingCat(null); return; }
    await supabase.from("goals").upsert(
      { user_id: user.id, category_id: catId, limit_amount: parsed, month: curMonth, year: curYear },
      { onConflict: "user_id,category_id,month,year" }
    );
    setMonthGoals(prev => ({ ...prev, [catId]: parsed }));
    setEditingCat(null);
  }

  async function removeEnvelope(catId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("goals").delete()
      .eq("user_id", user.id).eq("category_id", catId).eq("month", curMonth).eq("year", curYear);
    setMonthGoals(prev => { const n = { ...prev }; delete n[catId]; return n; });
  }

  const { income, necessities, wants, savings, emergencyMonths, monthlyExpense } = budget;
  const needsPct   = income > 0 ? (necessities / income) * 100 : 0;
  const wantsPct   = income > 0 ? (wants / income) * 100 : 0;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;
  const emergencyTarget = monthlyExpense * emergencyMonths;
  const emergencyHave   = goals.find(g => g.name.toLowerCase().includes("emergência") || g.name.toLowerCase().includes("reserva"))?.current_amount ?? 0;
  const localEmergencyPct = emergencyTarget > 0 ? Math.min((emergencyHave / emergencyTarget) * 100, 100) : 0;

  const investPct = incomeMonth > 0 ? (totalInvestments / incomeMonth) * 100 : 0;

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mx-5 mb-4" style={{ background: "var(--muted)" }}>
        {([
          { id: "metas",        label: "Metas",    icon: "fa-bullseye" },
          { id: "orcamento",    label: "Envelopes",icon: "fa-envelope-open-text" },
          { id: "investimentos",label: "Invest.",  icon: "fa-chart-line" },
          { id: "saude",        label: "Saúde",    icon: "fa-heart-pulse" },
        ] as const).map(t => {
          const isSaude = t.id === "saude";
          const scoreColor = healthScore >= 75 ? "var(--income)" : healthScore >= 50 ? "var(--gold)" : "var(--expense)";
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition-all"
              style={{ background: tab === t.id ? "var(--card)" : "transparent", color: tab === t.id ? "var(--foreground)" : "var(--muted-foreground)" }}>
              {isSaude && tab === t.id ? (
                <span className="text-xs font-bold" style={{ color: scoreColor }}>{healthScore}</span>
              ) : (
                <i className={`fa-solid ${t.icon} text-xs`} />
              )}
              {t.label}
            </button>
          );
        })}
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

      {/* ---- ENVELOPES TAB ---- */}
      {tab === "orcamento" && (
        <div className="flex flex-col gap-3 px-5">
          {/* 50/30/20 overview */}
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

          {/* Per-category envelopes */}
          <div className="card-pingo flex flex-col gap-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Envelopes por categoria</p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Toque para definir limite</p>
            </div>
            {CATEGORIES.map(cat => {
              const spent   = catSpend[cat.id] ?? 0;
              const limit   = monthGoals[cat.id];
              const hasLimit = limit !== undefined && limit > 0;
              const pct     = hasLimit ? Math.min((spent / limit) * 100, 100) : 0;
              const over    = hasLimit && spent > limit;
              const warn    = hasLimit && pct >= 80;
              const isEdit  = editingCat === cat.id;

              return (
                <div key={cat.id} className="py-2.5 border-b last:border-b-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cat.color}18` }}>
                      <i className={`fa-solid ${cat.icon} text-[10px]`} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{cat.name}</span>
                        <span className="text-[10px] mono-data"
                          style={{ color: over ? "var(--expense)" : warn ? "var(--gold)" : "var(--muted-foreground)" }}>
                          {BRL(spent)}{hasLimit && <> / {BRL(limit)}</>}
                        </span>
                      </div>
                      {hasLimit && (
                        <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: over ? "var(--expense)" : warn ? "var(--gold)" : cat.color }} />
                        </div>
                      )}
                    </div>
                    {!isEdit && (
                      <button onClick={() => { setEditingCat(cat.id); setEditVal(String(limit ?? "")); }}
                        className="text-[9px] px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: "var(--input)", color: "var(--muted-foreground)" }}>
                        {hasLimit ? "Editar" : "Definir"}
                      </button>
                    )}
                    {!isEdit && hasLimit && (
                      <button onClick={() => removeEnvelope(cat.id)}
                        className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.1)" }}>
                        <i className="fa-solid fa-xmark text-[8px]" style={{ color: "var(--expense)" }} />
                      </button>
                    )}
                  </div>
                  {isEdit && (
                    <div className="flex gap-2 mt-2 pl-9">
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEnvelope(cat.id); if (e.key === "Escape") setEditingCat(null); }}
                        placeholder="Limite R$"
                        className="flex-1 px-3 py-2 rounded-xl text-xs mono-data outline-none"
                        style={{ background: "var(--input)", border: `1px solid ${cat.color}50`, color: "var(--foreground)" }}
                        autoFocus
                      />
                      <button onClick={() => saveEnvelope(cat.id)}
                        className="px-3 rounded-xl text-xs font-semibold btn-primary">OK</button>
                      <button onClick={() => setEditingCat(null)}
                        className="px-2 rounded-xl text-xs"
                        style={{ background: "var(--input)", color: "var(--muted-foreground)" }}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- SAÚDE TAB ---- */}
      {tab === "saude" && (() => {
        const scoreColor = healthScore >= 75 ? "var(--income)" : healthScore >= 50 ? "var(--gold)" : "var(--expense)";
        const scoreLabel = healthScore >= 75 ? "Ótimo" : healthScore >= 50 ? "Regular" : "Atenção";
        const dims = [
          { label: "Taxa de poupança", pts: healthDimensions.savings, max: 30,
            hint: `${savingsRatePct.toFixed(0)}% poupado — meta: 20%+`,
            icon: "fa-piggy-bank", color: "#10B981" },
          { label: "Uso do crédito",   pts: healthDimensions.credit,  max: 20,
            hint: `${creditUtilPct.toFixed(0)}% do limite usado — ideal: abaixo de 30%`,
            icon: "fa-credit-card", color: "#6366F1" },
          { label: "Reserva de emergência", pts: healthDimensions.emergency, max: 25,
            hint: `${emergencyPct.toFixed(0)}% da reserva ideal (${emergencyMonths} meses)`,
            icon: "fa-shield-halved", color: "#FBBF24" },
          { label: "Hábito de investir", pts: healthDimensions.invest, max: 10,
            hint: totalInvestments > 0 ? `R$ ${totalInvestments.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} investidos` : "Nenhum investimento registrado",
            icon: "fa-chart-line", color: "#F97316" },
          { label: "Disciplina orçamentária", pts: healthDimensions.budget, max: 15,
            hint: "Regra 50/30/20 — quanto mais próximo, melhor",
            icon: "fa-chart-pie", color: "#EC4899" },
        ];
        const tips: string[] = [];
        if (healthDimensions.savings < 20) tips.push("Tente poupar ao menos 20% da renda — reduza desejos antes de necessidades.");
        if (creditUtilPct > 50) tips.push("Uso do crédito acima de 50% — pague a fatura integral para melhorar a pontuação.");
        if (emergencyPct < 50) tips.push("Reserva de emergência abaixo da metade — priorize isso antes de outros investimentos.");
        if (totalInvestments === 0) tips.push("Registre seus investimentos na aba Invest. para calcular pontuação de crescimento.");
        return (
          <div className="flex flex-col gap-3 px-5">
            {/* Score principal */}
            <div className="card-pingo flex items-center gap-5">
              <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl flex-shrink-0"
                style={{ background: `${scoreColor}15`, border: `2px solid ${scoreColor}` }}>
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{healthScore}</span>
                <span className="text-[9px] font-semibold" style={{ color: scoreColor }}>/100</span>
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold">{scoreLabel}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  Score de saúde financeira — baseado em poupança, crédito, reserva, investimentos e orçamento
                </p>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${healthScore}%`, background: scoreColor }} />
                </div>
              </div>
            </div>

            {/* Dimensões */}
            <div className="card-pingo flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Composição do score
              </p>
              {dims.map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${d.icon} text-[11px]`} style={{ color: d.color }} />
                      <span className="text-xs">{d.label}</span>
                    </div>
                    <span className="text-xs mono-data font-semibold" style={{ color: d.color }}>
                      {d.pts}/{d.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(d.pts / d.max) * 100}%`, background: d.color }} />
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{d.hint}</p>
                </div>
              ))}
            </div>

            {/* Dicas */}
            {tips.length > 0 && (
              <div className="card-pingo flex flex-col gap-2">
                <p className="text-xs font-semibold flex items-center gap-2">
                  <i className="fa-solid fa-lightbulb text-xs" style={{ color: "var(--gold)" }} />
                  Como melhorar seu score
                </p>
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--primary)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {tips.length === 0 && healthScore >= 75 && (
              <div className="card-pingo flex items-center gap-3 py-4">
                <i className="fa-solid fa-trophy text-2xl" style={{ color: "var(--gold)" }} />
                <div>
                  <p className="text-sm font-semibold">Parabéns! Saúde financeira excelente</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    Continue mantendo seus hábitos financeiros saudáveis
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
