import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import InsightsClient from "./InsightsClient";
import MonthNav from "@/components/MonthNav";
import { parseMonthParam } from "@/lib/month-utils";
import { CATEGORIES } from "@/lib/categories";
import { MONTH_NAMES } from "@/lib/formatters";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ m?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const { month, year } = parseMonthParam(sp?.m);

  const mStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const mEnd   = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // Next 6 months window (always based on today so future chart stays relevant)
  const today = new Date();
  const futureStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const futureEnd   = new Date(today.getFullYear(), today.getMonth() + 7, 1);
  const futureStartStr = `${futureStart.getFullYear()}-${String(futureStart.getMonth() + 1).padStart(2, "0")}-01`;
  const futureEndStr   = `${futureEnd.getFullYear()}-${String(futureEnd.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: txRows },
    { data: histRows },
    { data: futureRows },
  ] = await Promise.all([
    // Current month transactions
    supabase
      .from("transactions")
      .select("amount,type,category_id,tx_type")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd),

    // Last 6 months for monthly chart
    supabase
      .from("transactions")
      .select("amount,type,date,tx_type")
      .eq("user_id", user.id)
      .gte("date", (() => {
        const d = new Date(year, month - 1 - 5, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      })())
      .lt("date", mEnd),

    // Future committed expenses (installments already in DB with future dates)
    supabase
      .from("transactions")
      .select("amount,date")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .neq("tx_type", "transfer_internal")
      .gte("date", futureStartStr)
      .lt("date", futureEndStr),
  ]);

  const txList = txRows ?? [];

  // Category breakdown (current month expenses)
  const catSpend = new Map<string, number>();
  txList
    .filter(t => t.type === "expense" && t.tx_type !== "transfer_internal")
    .forEach(t => {
      const k = t.category_id ?? "outros";
      catSpend.set(k, (catSpend.get(k) ?? 0) + Number(t.amount));
    });

  const totalExpense = Array.from(catSpend.values()).reduce((s, v) => s + v, 0);
  const categorySummary = Array.from(catSpend.entries())
    .map(([catId, amount]) => {
      const cat = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[CATEGORIES.length - 1];
      return {
        id: cat.id, name: cat.name, icon: cat.icon, color: cat.color,
        amount, percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Last 6 months monthly summaries
  const monthMap = new Map<string, { income: number; expense: number; month: number; year: number }>();
  (histRows ?? []).forEach(t => {
    const d = t.date.slice(0, 7);
    const [y, m] = d.split("-").map(Number);
    if (!monthMap.has(d)) monthMap.set(d, { income: 0, expense: 0, month: m, year: y });
    const entry = monthMap.get(d)!;
    if (t.tx_type === "transfer_internal") return;
    if (t.type === "income")  entry.income  += Number(t.amount);
    if (t.type === "expense") entry.expense += Number(t.amount);
  });

  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label:   `${MONTH_NAMES[v.month - 1].slice(0, 3)}/${String(v.year).slice(2)}`,
      month:   v.month,
      year:    v.year,
      income:  Math.round(v.income * 100) / 100,
      expense: Math.round(v.expense * 100) / 100,
    }));

  // Future committed months
  const futureMonthMap = new Map<string, { committed: number; month: number; year: number }>();
  (futureRows ?? []).forEach(t => {
    const d = t.date.slice(0, 7);
    const [y, m] = d.split("-").map(Number);
    if (!futureMonthMap.has(d)) futureMonthMap.set(d, { committed: 0, month: m, year: y });
    futureMonthMap.get(d)!.committed += Number(t.amount);
  });

  const futureMonths = Array.from(futureMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label:     `${MONTH_NAMES[v.month - 1].slice(0, 3)}/${String(v.year).slice(2)}`,
      month:     v.month,
      year:      v.year,
      committed: Math.round(v.committed * 100) / 100,
    }));

  const currentIncome  = txList.filter(t => t.type === "income"  && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const currentExpense = txList.filter(t => t.type === "expense" && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate    = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>Insights</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Visão financeira do mês</p>
        </div>
        <MonthNav month={month} year={year} basePath="/insights" />
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <InsightsClient
          categorySummary={categorySummary}
          monthlyData={monthlyData}
          futureMonths={futureMonths}
          currentIncome={currentIncome}
          currentExpense={currentExpense}
          savingsRate={savingsRate}
          month={month}
          year={year}
        />
      </div>

      <BottomNav />
    </main>
  );
}
