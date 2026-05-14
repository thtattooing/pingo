import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BalanceCard from "@/components/BalanceCard";
import CategoryBar from "@/components/CategoryBar";
import TransactionList from "@/components/TransactionList";
import MonthNav from "@/components/MonthNav";
import ThemeToggle from "@/components/ThemeToggle";
import EyeToggle from "@/components/EyeToggle";
import CaixaLivreCard from "@/components/CaixaLivreCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";
import { BRL } from "@/lib/formatters";
import { parseMonthParam, monthRange } from "@/lib/month-utils";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-2"
      style={{ color: "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ m?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const { month, year } = parseMonthParam(params?.m);
  const { mStart, mEnd } = monthRange(month, year);

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

  const today30 = new Date();
  today30.setDate(today30.getDate() + 30);
  const date30 = today30.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const [{ data: goalRows }, { data: bankMeta }, { data: checkingTxRows }, { data: next30Rows }] = await Promise.all([
    supabase
      .from("goals")
      .select("category_id,limit_amount")
      .eq("user_id", user.id)
      .eq("month", month).eq("year", year),

    supabase
      .from("bank_accounts")
      .select("initial_balance")
      .eq("user_id", user.id),

    supabase
      .from("transactions")
      .select("amount,type,tx_type")
      .eq("user_id", user.id)
      .neq("account_type", "credit_card"),

    supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("account_type", "credit_card")
      .eq("type", "expense")
      .neq("tx_type", "transfer_internal")
      .gt("date", todayStr)
      .lte("date", date30),
  ]);

  const txList   = txRows ?? [];
  const goalList = goalRows ?? [];

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

  // Caixa Livre (Etapa 1)
  const initialBalance  = (bankMeta ?? []).reduce((s, a) => s + Number(a.initial_balance ?? 0), 0);
  const checkingIncome  = (checkingTxRows ?? []).filter(t => t.type === "income"  && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const checkingExpense = (checkingTxRows ?? []).filter(t => t.type === "expense" && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const checkingBalance = initialBalance + checkingIncome - checkingExpense;

  const ccMonthExpense  = txList.filter(t => t.account_type === "credit_card" && t.type === "expense" && t.tx_type !== "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const ccMonthPayments = txList.filter(t => t.account_type === "credit_card" && t.type === "income"  && t.tx_type === "transfer_internal").reduce((s, t) => s + Number(t.amount), 0);
  const ccNetFatura     = Math.max(0, ccMonthExpense - ccMonthPayments);
  const next30dCC       = (next30Rows ?? []).reduce((s, t) => s + Number(t.amount), 0);

  // Subscriptions (Etapa 4)
  const recurringTx = txList.filter(t => t.type === "expense" && t.is_recurring);
  const subMap = new Map<string, number>();
  const subCat = new Map<string, string>();
  recurringTx.forEach(t => {
    const key = (t.description ?? "").toLowerCase().trim();
    subMap.set(key, (subMap.get(key) ?? 0) + Number(t.amount));
    if (!subCat.has(key)) subCat.set(key, t.category_id ?? "outros");
  });
  const subscriptions = Array.from(subMap.entries())
    .map(([key, amount]) => {
      const catId = subCat.get(key) ?? "outros";
      const cat   = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[CATEGORIES.length - 1];
      const rawDesc = recurringTx.find(t => (t.description ?? "").toLowerCase().trim() === key)?.description ?? key;
      return { description: rawDesc, amount, category: catId, categoryIcon: cat.icon, categoryColor: cat.color };
    })
    .sort((a, b) => b.amount - a.amount);

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
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
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
            <EyeToggle />
            <ThemeToggle />
            <Link href="/configuracoes"
              className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: "var(--primary)" }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white">{userName.charAt(0).toUpperCase()}</span>
              )}
            </Link>
          </div>
        </div>
        <MonthNav month={month} year={year} basePath="/home" />
      </header>

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

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-5">

        {/* Hero saldo */}
        <BalanceCard balance={balance} income={income} expense={expense} userName={userName} />

        {/* Caixa Disponível */}
        <div>
          <SectionLabel>Caixa Disponível</SectionLabel>
          <CaixaLivreCard
            checkingBalance={checkingBalance}
            ccNetFatura={ccNetFatura}
            next30dCC={next30dCC}
          />
        </div>

        {/* Assinaturas */}
        {subscriptions.length > 0 && (
          <div>
            <SectionLabel>Assinaturas do Mês</SectionLabel>
            <SubscriptionCard subscriptions={subscriptions} />
          </div>
        )}

        {/* Gastos por conta + recorrentes */}
        {accounts.length > 0 && (
          <div>
            <SectionLabel>Gastos por conta</SectionLabel>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {accounts.map(acc => (
                <Link key={acc.name} href={`/cartoes?m=${year}-${String(month).padStart(2,"0")}`}
                  className="flex-shrink-0 rounded-2xl px-4 py-3 min-w-[130px] no-underline active:scale-95 transition-transform"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <i className={`fa-solid ${acc.type === "credit_card" ? "fa-credit-card" : "fa-building-columns"} text-xs`}
                      style={{ color: acc.type === "credit_card" ? "var(--primary)" : "#8B5CF6" }} />
                    <span className="text-[10px] truncate max-w-[90px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                      {acc.name}
                    </span>
                  </div>
                  <p className="mono-data text-sm font-bold" style={{ color: "var(--expense)" }}>
                    {BRL(acc.total)}
                  </p>
                </Link>
              ))}
              {recurringTotal > 0 && (
                <div className="flex-shrink-0 rounded-2xl px-4 py-3 min-w-[130px]"
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <i className="fa-solid fa-rotate text-xs" style={{ color: "var(--gold)" }} />
                    <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Recorrentes</span>
                  </div>
                  <p className="mono-data text-sm font-bold" style={{ color: "var(--gold)" }}>
                    {BRL(recurringTotal)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categorias */}
        {categorySummary.length > 0 && (
          <div>
            <SectionLabel>Categorias</SectionLabel>
            <CategoryBar categories={categorySummary} total={totalExpense} />
          </div>
        )}

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/importar"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 no-underline transition-all active:scale-95"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.12)" }}>
              <i className="fa-solid fa-file-arrow-up text-sm" style={{ color: "#818CF8" }} />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">Importar</p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>extrato / fatura</p>
            </div>
          </Link>
          <Link href="/ir"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 no-underline transition-all active:scale-95"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.12)" }}>
              <i className="fa-solid fa-landmark text-sm" style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">Receita Federal</p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>declaração IR</p>
            </div>
          </Link>
        </div>

        {/* Transações */}
        <TransactionList transactions={transactions} />

        <Link href={`/transacoes?m=${year}-${String(month).padStart(2,"0")}`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm no-underline transition-all active:scale-95"
          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
          <i className="fa-solid fa-list text-xs" />
          Ver todas as transações
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
