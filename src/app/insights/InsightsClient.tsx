"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie,
} from "recharts";
import { BRL } from "@/lib/formatters";

interface CategorySummary {
  id: string; name: string; icon: string; color: string;
  amount: number; percentage: number;
}
interface MonthSummary {
  label: string; month: number; year: number;
  income: number; expense: number;
}

interface Props {
  categorySummary: CategorySummary[];
  monthlyData: MonthSummary[];
  currentIncome: number;
  currentExpense: number;
  savingsRate: number;
  month: number;
  year: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {BRL(p.value)}</p>
      ))}
    </div>
  );
}

export default function InsightsClient({
  categorySummary, monthlyData, currentIncome, currentExpense, savingsRate,
}: Props) {
  const balance = currentIncome - currentExpense;
  const isPositive = balance >= 0;

  // Insight tips based on data
  const tips: string[] = [];
  if (categorySummary.length > 0) {
    const top = categorySummary[0];
    tips.push(`${top.name} foi sua maior despesa este mês: ${BRL(top.amount)} (${top.percentage.toFixed(0)}% do total).`);
  }
  if (savingsRate > 20) {
    tips.push(`Você poupou ${savingsRate.toFixed(0)}% da renda este mês. Continue assim!`);
  } else if (savingsRate > 0) {
    tips.push(`Sua taxa de poupança é ${savingsRate.toFixed(0)}%. Tente manter acima de 20%.`);
  } else if (currentExpense > currentIncome && currentIncome > 0) {
    tips.push(`Suas despesas superaram a renda em ${BRL(currentExpense - currentIncome)}. Atenção!`);
  }
  if (monthlyData.length >= 2) {
    const last = monthlyData[monthlyData.length - 1];
    const prev = monthlyData[monthlyData.length - 2];
    if (last.expense > prev.expense * 1.2) {
      tips.push(`Seus gastos aumentaram ${(((last.expense - prev.expense) / prev.expense) * 100).toFixed(0)}% em relação ao mês anterior.`);
    }
  }

  return (
    <div className="px-5 flex flex-col gap-4">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl px-3 py-3 flex flex-col gap-1"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Entradas</p>
          <p className="mono-data text-xs font-semibold" style={{ color: "var(--income)" }}>{BRL(currentIncome)}</p>
        </div>
        <div className="rounded-2xl px-3 py-3 flex flex-col gap-1"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Saídas</p>
          <p className="mono-data text-xs font-semibold" style={{ color: "var(--expense)" }}>{BRL(currentExpense)}</p>
        </div>
        <div className="rounded-2xl px-3 py-3 flex flex-col gap-1"
          style={{ background: isPositive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${isPositive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Saldo</p>
          <p className="mono-data text-xs font-semibold" style={{ color: isPositive ? "var(--income)" : "var(--expense)" }}>
            {isPositive ? "+" : ""}{BRL(balance)}
          </p>
        </div>
      </div>

      {/* Savings rate */}
      {currentIncome > 0 && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex flex-col gap-0.5 flex-1">
            <p className="text-xs font-medium">Taxa de poupança</p>
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {savingsRate > 0 ? `${savingsRate.toFixed(1)}% da renda poupada` : "Gastos superaram a renda"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: savingsRate >= 20 ? "rgba(16,185,129,0.12)" : savingsRate >= 0 ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.12)",
              border: `2px solid ${savingsRate >= 20 ? "var(--income)" : savingsRate >= 0 ? "var(--gold)" : "var(--expense)"}`,
            }}>
            <span className="text-xs font-bold" style={{ color: savingsRate >= 20 ? "var(--income)" : savingsRate >= 0 ? "var(--gold)" : "var(--expense)" }}>
              {Math.max(0, savingsRate).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Monthly bar chart */}
      {monthlyData.length > 1 && (
        <div className="rounded-2xl px-4 py-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-3">Evolução mensal</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barGap={2} barCategoryGap="25%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income"  name="Entradas" fill="var(--income)"  radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Saídas"   fill="var(--expense)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--income)" }} />
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--expense)" }} />
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Saídas</span>
            </div>
          </div>
        </div>
      )}

      {/* Category donut */}
      {categorySummary.length > 0 && (
        <div className="rounded-2xl px-4 py-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-3">Gastos por categoria</p>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySummary.map(c => ({ ...c, fill: c.color }))}
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={62}
                    dataKey="amount"
                    strokeWidth={2}
                    stroke="var(--background)"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as CategorySummary;
                      return (
                        <div className="rounded-xl px-3 py-2 text-xs shadow-lg"
                          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                          <p style={{ color: d.color }} className="font-semibold">{d.name}</p>
                          <p>{BRL(d.amount)} · {d.percentage.toFixed(0)}%</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {categorySummary.slice(0, 6).map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-[11px] truncate flex-1" style={{ color: "var(--foreground)" }}>{c.name}</span>
                  <span className="mono-data text-[10px] flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    {c.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown bars */}
          <div className="mt-4 flex flex-col gap-3">
            {categorySummary.map(c => (
              <div key={c.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${c.icon} text-[11px]`} style={{ color: c.color }} />
                    <span className="text-xs">{c.name}</span>
                  </div>
                  <span className="mono-data text-xs font-medium">{BRL(c.amount)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "var(--input)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${c.percentage}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights / tips */}
      {tips.length > 0 && (
        <div className="rounded-2xl px-4 py-4 flex flex-col gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-lightbulb text-xs" style={{ color: "var(--gold)" }} />
            Insights do mês
          </p>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--primary)" }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{tip}</p>
            </div>
          ))}
        </div>
      )}

      {categorySummary.length === 0 && (
        <div className="card-pingo flex flex-col items-center gap-3 py-12 text-center">
          <i className="fa-solid fa-chart-pie text-3xl" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma despesa registrada neste mês</p>
        </div>
      )}
    </div>
  );
}
