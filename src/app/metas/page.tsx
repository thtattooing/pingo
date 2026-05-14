import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MetasClient from "./MetasClient";

const NECESSITIES_CATS = ["moradia","energia","agua","saude","alimentacao","transporte","educacao"];
const WANTS_CATS       = ["lazer","vestuario","assinaturas","outros"];

export default async function MetasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();
  const mStart = `${curYear}-${String(curMonth).padStart(2, "0")}-01`;
  const mEnd   = curMonth === 12
    ? `${curYear + 1}-01-01`
    : `${curYear}-${String(curMonth + 1).padStart(2, "0")}-01`;

  const [
    { data: txRows },
    { data: goalsData },
    { data: investments },
    { data: settings },
    { data: cardSettings },
    { data: monthGoalsData },
  ] = await Promise.all([
    supabase.from("transactions")
      .select("amount,type,category_id,account_type,tx_type")
      .eq("user_id", user.id).gte("date", mStart).lt("date", mEnd),
    supabase.from("savings_goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("investments").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("user_settings").select("emergency_fund_months").eq("user_id", user.id).maybeSingle(),
    supabase.from("card_settings").select("account_name,credit_limit").eq("user_id", user.id),
    supabase.from("goals")
      .select("category_id,limit_amount")
      .eq("user_id", user.id)
      .eq("month", curMonth).eq("year", curYear),
  ]);

  const tx = (txRows ?? []).filter(t => t.tx_type !== "transfer_internal");

  const income  = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const necessities = tx.filter(t => t.type === "expense" && NECESSITIES_CATS.includes(t.category_id ?? ""))
    .reduce((s, t) => s + Number(t.amount), 0);
  const wants = tx.filter(t => t.type === "expense" && WANTS_CATS.includes(t.category_id ?? ""))
    .reduce((s, t) => s + Number(t.amount), 0);
  const savings = Math.max(0, income - expense);

  // Per-category spending (for envelopes)
  const catSpend: Record<string, number> = {};
  tx.filter(t => t.type === "expense").forEach(t => {
    const k = t.category_id ?? "outros";
    catSpend[k] = (catSpend[k] ?? 0) + Number(t.amount);
  });

  // Monthly category goals (envelopes)
  const monthGoals: Record<string, number> = {};
  (monthGoalsData ?? []).forEach(g => {
    monthGoals[g.category_id] = Number(g.limit_amount);
  });

  const totalInvestments = (investments ?? []).reduce((s, i) => s + Number(i.amount), 0);

  // Credit utilization
  const totalCreditLimit = (cardSettings ?? []).reduce((s, c) => s + Number(c.credit_limit ?? 0), 0);
  const totalCreditSpend = tx
    .filter(t => t.type === "expense" && t.account_type === "credit_card")
    .reduce((s, t) => s + Number(t.amount), 0);
  const creditUtilPct = totalCreditLimit > 0 ? Math.min((totalCreditSpend / totalCreditLimit) * 100, 100) : 0;

  // Emergency fund
  const emergencyMonths   = settings?.emergency_fund_months ?? 6;
  const emergencyGoal = (goalsData ?? []).find(g =>
    g.name.toLowerCase().includes("reserva") || g.name.toLowerCase().includes("emergência") || g.name.toLowerCase().includes("emergencia")
  );
  const emergencyHave   = emergencyGoal?.current_amount ?? 0;
  const emergencyTarget = expense * emergencyMonths;
  const emergencyPct    = emergencyTarget > 0 ? Math.min((emergencyHave / emergencyTarget) * 100, 100) : 0;

  // Health Score (0-100)
  const savingsRatePct = income > 0 ? Math.max(0, (income - expense) / income * 100) : 0;
  const savingsScore   = Math.min(30, (savingsRatePct / 20) * 30);         // 20%+ = 30 pts
  const creditScore    = Math.max(0, 20 - (creditUtilPct / 80) * 20);      // 0% = 20, 80%+ = 0
  const emergScore     = Math.min(25, (emergencyPct / 100) * 25);           // 100% funded = 25
  const investScore    = totalInvestments > 0
    ? Math.min(10, (totalInvestments / Math.max(income * 3, 1)) * 10)
    : 0;                                                                    // 3× income = 10
  const needsPct   = income > 0 ? (necessities / income) * 100 : 0;
  const wantsPct   = income > 0 ? (wants / income) * 100 : 0;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;
  const budgetScore = income > 0
    ? Math.max(0, 15
        - Math.max(0, needsPct - 50) * 0.3
        - Math.max(0, wantsPct - 30) * 0.3
        - Math.max(0, 20 - savingsPct) * 0.15)
    : 0;
  const healthScore = Math.min(100, Math.round(savingsScore + creditScore + emergScore + investScore + budgetScore));

  const healthDimensions = {
    savings:   Math.round(savingsScore),
    credit:    Math.round(creditScore),
    emergency: Math.round(emergScore),
    invest:    Math.round(investScore),
    budget:    Math.max(0, Math.round(budgetScore)),
  };

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-5">
        <h1 className="text-2xl font-normal leading-tight" style={{ fontFamily: "var(--font-calistoga)" }}>
          Metas &amp; Finanças
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Planejamento e patrimônio
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-0">
        <MetasClient
          initialGoals={goalsData ?? []}
          initialInvestments={investments ?? []}
          budget={{
            income,
            necessities,
            wants,
            savings,
            emergencyMonths,
            monthlyExpense: expense,
          }}
          totalInvestments={totalInvestments}
          incomeMonth={income}
          healthScore={healthScore}
          healthDimensions={healthDimensions}
          creditUtilPct={creditUtilPct}
          emergencyPct={emergencyPct}
          savingsRatePct={savingsRatePct}
          catSpend={catSpend}
          monthGoals={monthGoals}
          curMonth={curMonth}
          curYear={curYear}
        />
      </div>

      <BottomNav />
    </main>
  );
}
