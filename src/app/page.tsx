import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BalanceCard from "@/components/BalanceCard";
import CategoryBar from "@/components/CategoryBar";
import TransactionList from "@/components/TransactionList";
import MonthNav from "@/components/MonthNav";
import ThemeToggle from "@/components/ThemeToggle";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";
import { BRL } from "@/lib/formatters";

function parseMonthParam(m?: string): { month: number; year: number } {
  const now = new Date();
  if (m) {
    const [y, mo] = m.split("-").map(Number);
    if (y > 2000 && mo >= 1 && mo <= 12) return { month: mo, year: y };
  }
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function monthRange(month: number, year: number) {
  const mStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const mEnd   = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { mStart, mEnd };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { m?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { month, year } = parseMonthParam(searchParams?.m);
  const { mStart, mEnd } = monthRange(month, year);

  // Try with extended columns; fall back to base if schema not yet migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txRows: any[] | null = null;
  {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,description,amount,type,category_id,date,account_type,account_name,is_recurring,subcategory,tx_type")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd)
      .order("date", { ascending: false })
      .limit(200);
    if (!error) {
      txRows = data;
    } else {
      const fallback = await supabase
        .from("transactions")
        .select("id,description,amount,type,category_id,date")
        .eq("user_id", user.id)
        .gte("date", mStart).lt("date", mEnd)
        .order("date", { ascending: false })
        .limit(200);
      txRows = fallback.data;
    }
  }

  const { data: goalRows } = await supabase
    .from("goals")
    .select("category_id,limit_amount")
    .eq("user_id", user.id)
    .eq("month", month).eq("year", year);

  const txList   = txRows ?? [];
  const goalList = goalRows ?? [];

  // Exclude transfer_internal to prevent double counting when paying credit card from checking
  const income  = txList.filter(t => t.type === "income"  && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txList.filter(t => t.type === "expense" && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  const catSpend = new Map<string, number>();
  txList.filter(t => t.type === "expense").forEach(t => {
    const k = t.category_id ?? "outros";
    catSpend.set(k, (catSpend.get(k) ?? 0) + Number(t.amount));
  });
  const categorySummary = Array.from(catSpend.entries())
    .map(([catId, amount]) => {
      const cat  = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[CATEGORIES.length - 1];
      const goal = goalList.find(g => g.category_id === catId);
      return { name: cat.name, icon: cat.icon, amount, limit: goal ? Number(goal.limit_amount) : undefined, color: cat.color };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const totalExpense = categorySummary.reduce((s, c) => s + c.amount, 0);
  const alertCat = categorySummary.find(c => c.limit && c.amount >= c.limit * 0.8);

  // Account breakdown
  const accountMap = new Map<string, { type: string; name: string; total: number }>();
  txList.filter(t => t.type === "expense" && t.account_name).forEach(t => {
    const key = t.account_name!;
    if (!accountMap.has(key)) accountMap.set(key, { type: t.account_type ?? "checking", name: key, total: 0 });
    accountMap.get(key)!.total += Number(t.amount);
  });
  const accounts = Array.from(accountMap.values()).sort((a, b) => b.total - a.total);

  const recurringTotal = txList
    .filter(t => t.type === "expense" && t.is_recurring)
    .reduce((s, t) => s + Number(t.amount), 0);

  const transactions = txList.slice(0, 15).map(t => ({
    id:                 t.id,
    description:        t.description,
    amount:             Number(t.amount),
    type:               t.type as "income" | "expense",
    category:           t.category_id ?? "outros",
    date:               t.date,
    accountType:        t.account_type ?? undefined,
    accountName:        t.account_name ?? undefined,
    isRecurring:        t.is_recurring ?? false,
    subcategory:        t.subcategory ?? undefined,
    installments:       t.installments ?? undefined,
    installmentCurrent: t.installment_current ?? undefined,
    isShared:           t.is_shared ?? false,
  }));

  const userName = user.user_metadata?.full_name ?? user.email ?? "você";

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      {/* Header */}
      <header className="px-5 pt-12 pb-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 12px rgba(244,114,182,0.4)" }}>
              <i className="fa-solid fa-piggy-bank text-white text-base" />
            </div>
            <span className="text-xl font-normal leading-none" style={{ fontFamily: "var(--font-calistoga)" }}>
              PINGO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: "var(--primary)" }}>
              {user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Month navigation — destaque */}
        <MonthNav month={month} year={year} basePath="/" />
      </header>

      {/* Alerta de limite */}
      {alertCat && (
        <div className="px-5 mb-3">
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 animate-fade-in-up"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <i className="fa-solid fa-triangle-exclamation animate-pulse-alert text-sm text-expense" />
            <p className="text-xs font-medium text-expense flex-1">
              {alertCat.name} em {alertCat.limit ? Math.round((alertCat.amount / alertCat.limit) * 100) : 0}% do limite mensal
            </p>
            <i className="fa-solid fa-chevron-right text-xs text-expense opacity-60" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        <BalanceCard balance={balance} income={income} expense={expense} userName={userName} />

        {/* Breakdown por conta → link para /cartoes */}
        {accounts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {accounts.map(acc => (
              <Link key={acc.name} href={`/cartoes?m=${year}-${String(month).padStart(2,"0")}`}
                className="flex-shrink-0 rounded-2xl px-4 py-3 min-w-[140px] no-underline"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <i className={`fa-solid ${acc.type === "credit_card" ? "fa-credit-card" : "fa-building-columns"} text-xs`}
                    style={{ color: acc.type === "credit_card" ? "var(--primary)" : "#8B5CF6" }} />
                  <span className="text-[10px] truncate max-w-[100px]" style={{ color: "var(--muted-foreground)" }}>
                    {acc.name}
                  </span>
                </div>
                <p className="mono-data text-sm font-semibold" style={{ color: "var(--expense)" }}>
                  {BRL(acc.total)}
                </p>
              </Link>
            ))}
            {recurringTotal > 0 && (
              <div className="flex-shrink-0 rounded-2xl px-4 py-3 min-w-[140px]"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <i className="fa-solid fa-rotate text-xs" style={{ color: "var(--gold)" }} />
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Recorrentes</span>
                </div>
                <p className="mono-data text-sm font-semibold" style={{ color: "var(--gold)" }}>
                  {BRL(recurringTotal)}
                </p>
              </div>
            )}
          </div>
        )}

        {categorySummary.length > 0 && (
          <CategoryBar categories={categorySummary} total={totalExpense} />
        )}

        {/* Quick action */}
        <Link href="/lancamento"
          className="card-pingo flex items-center gap-4 active:scale-95 transition-transform no-underline"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", border: "none" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center relative"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <i className="fa-solid fa-piggy-bank text-white text-lg" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: "var(--gold)", color: "#100A18" }}>+</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Pingar no porquinho</p>
            <p className="text-xs text-white/70">Diga o que gastou ou recebeu</p>
          </div>
          <i className="fa-solid fa-arrow-right text-white/80" />
        </Link>

        <TransactionList transactions={transactions} />

        {/* Ver todas */}
        <Link href={`/transacoes?m=${year}-${String(month).padStart(2,"0")}`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm no-underline transition-all"
          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
          <i className="fa-solid fa-list text-xs" />
          Ver todas as transações
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
