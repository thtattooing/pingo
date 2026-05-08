import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import GoalEditor, { GoalRow } from "@/components/GoalEditor";
import { CATEGORIES } from "@/lib/categories";

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

interface MonthEntry {
  key: string;
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
}

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  // Fetch last 12 months of summary
  const since = new Date(now);
  since.setMonth(since.getMonth() - 11);
  const sinceDate = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ data: summaryRows }, { data: goalRows }] = await Promise.all([
    supabase
      .from("monthly_summary")
      .select("year, month, type, total")
      .eq("user_id", user.id)
      .gte("year", since.getFullYear()),
    supabase
      .from("goals")
      .select("category_id, limit_amount")
      .eq("user_id", user.id)
      .eq("month", curMonth)
      .eq("year", curYear),
  ]);

  // Aggregate monthly totals
  const monthMap = new Map<string, MonthEntry>();
  (summaryRows ?? []).forEach(row => {
    const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        key,
        label: `${MONTH_NAMES[row.month - 1]}/${String(row.year).slice(2)}`,
        year: row.year,
        month: row.month,
        income: 0,
        expense: 0,
      });
    }
    const entry = monthMap.get(key)!;
    if (row.type === "income")  entry.income  += Number(row.total);
    else                        entry.expense += Number(row.total);
  });

  const months: MonthEntry[] = Array.from(monthMap.values())
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 12);

  const maxVal = Math.max(...months.flatMap(m => [m.income, m.expense]), 1);

  // Build goals for GoalEditor (categories with spend this month)
  const { data: txThisMonth } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("type" as never, "expense")
    .gte("date", `${curYear}-${String(curMonth).padStart(2, "0")}-01`)
    .lt("date", curMonth === 12
      ? `${curYear + 1}-01-01`
      : `${curYear}-${String(curMonth + 1).padStart(2, "0")}-01`);

  const spendMap = new Map<string, number>();
  (txThisMonth ?? []).forEach(t => {
    const key = t.category_id ?? "outros";
    spendMap.set(key, (spendMap.get(key) ?? 0) + Number(t.amount));
  });

  // Merge with all categories that either have spend or have a goal
  const goalMap = new Map((goalRows ?? []).map(g => [g.category_id, Number(g.limit_amount)]));
  const allCatIds = new Set([...spendMap.keys(), ...goalMap.keys()]);

  const goalsForEditor: GoalRow[] = CATEGORIES
    .filter(c => allCatIds.has(c.id))
    .map(c => ({
      category_id:  c.id,
      limit_amount: goalMap.get(c.id) ?? null,
      spent:        spendMap.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  const totalIncome  = months[0]?.income  ?? 0;
  const totalExpense = months[0]?.expense ?? 0;
  const prevIncome   = months[1]?.income  ?? 0;
  const prevExpense  = months[1]?.expense ?? 0;

  function diffPct(cur: number, prev: number) {
    if (prev === 0) return null;
    return Math.round(((cur - prev) / prev) * 100);
  }
  const expDiff = diffPct(totalExpense, prevExpense);
  const incDiff = diffPct(totalIncome, prevIncome);

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-5">
        <h1
          className="text-2xl font-normal leading-tight"
          style={{ fontFamily: "var(--font-calistoga)" }}
        >
          Histórico
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Sua linha do tempo financeira
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">

        {/* Resumo do mês atual vs anterior */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Entradas", value: totalIncome,  diff: incDiff,  color: "var(--income)",  icon: "fa-arrow-down" },
            { label: "Saídas",   value: totalExpense, diff: expDiff,  color: "var(--expense)", icon: "fa-arrow-up" },
          ].map(({ label, value, diff, color, icon }) => (
            <div key={label} className="card-pingo">
              <div className="flex items-center gap-1.5 mb-2">
                <i className={`fa-solid ${icon} text-xs`} style={{ color }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
              </div>
              <p className="mono-data text-base font-semibold" style={{ color }}>{BRL(value)}</p>
              {diff !== null && (
                <p className="text-[10px] mt-1 mono-data"
                  style={{ color: label === "Saídas" ? (diff > 0 ? "var(--expense)" : "var(--income)") : (diff > 0 ? "var(--income)" : "var(--expense)") }}>
                  {diff > 0 ? "+" : ""}{diff}% vs mês anterior
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Gráfico mensal */}
        {months.length > 0 && (
          <div className="card-pingo flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
              Últimos {months.length} meses
            </h3>

            {months.map((m, i) => (
              <div key={m.key} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="mono-data text-xs w-12" style={{ color: "var(--muted-foreground)" }}>
                    {m.label}
                  </span>
                  <span className="mono-data text-[10px]" style={{ color: m.income >= m.expense ? "var(--income)" : "var(--expense)" }}>
                    {m.income >= m.expense ? "+" : "-"}{BRL(Math.abs(m.income - m.expense))}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {/* Income bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(m.income / maxVal) * 100}%`, background: "var(--income)" }}
                    />
                  </div>
                  {/* Expense bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(m.expense / maxVal) * 100}%`, background: "var(--expense)" }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full" style={{ background: "var(--income)" }} />
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full" style={{ background: "var(--expense)" }} />
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Saídas</span>
              </div>
            </div>
          </div>
        )}

        {months.length === 0 && (
          <div className="card-pingo flex flex-col items-center gap-3 py-10 text-center">
            <i className="fa-solid fa-chart-line text-3xl" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Nenhum dado ainda. Lance transações ou importe um extrato.
            </p>
          </div>
        )}

        {/* Goals editor */}
        {goalsForEditor.length > 0 && (
          <GoalEditor
            goals={goalsForEditor}
            month={curMonth}
            year={curYear}
            userId={user.id}
          />
        )}

        {goalsForEditor.length === 0 && (
          <div className="card-pingo flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
              Metas do mês
            </h3>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Lance ou importe transações para definir metas por categoria.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
