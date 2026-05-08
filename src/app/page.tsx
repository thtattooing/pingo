import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BalanceCard from "@/components/BalanceCard";
import CategoryBar from "@/components/CategoryBar";
import TransactionList from "@/components/TransactionList";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const [{ data: txRows }, { data: goalRows }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,description,amount,type,category_id,date")
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .lt("date", monthEnd)
      .order("date", { ascending: false })
      .limit(50),
    supabase
      .from("goals")
      .select("category_id,limit_amount")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year),
  ]);

  const txList = txRows ?? [];
  const goalList = goalRows ?? [];

  const income  = txList.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txList.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  // Agrupa gastos por categoria
  const catSpend = new Map<string, number>();
  txList.filter(t => t.type === "expense").forEach(t => {
    const key = t.category_id ?? "outros";
    catSpend.set(key, (catSpend.get(key) ?? 0) + Number(t.amount));
  });

  const categorySummary = Array.from(catSpend.entries())
    .map(([catId, amount]) => {
      const cat = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[CATEGORIES.length - 1];
      const goal = goalList.find(g => g.category_id === catId);
      return { name: cat.name, icon: cat.icon, amount, limit: goal ? Number(goal.limit_amount) : undefined, color: cat.color };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const totalExpense = categorySummary.reduce((s, c) => s + c.amount, 0);

  // Alerta: categoria que ultrapassou 80% do limite
  const alertCat = categorySummary.find(c => c.limit && c.amount >= c.limit * 0.8);

  const transactions = txList.slice(0, 10).map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type as "income" | "expense",
    category: t.category_id ?? "outros",
    date: t.date,
  }));

  const userName = user.user_metadata?.full_name ?? user.email ?? "você";
  const label = monthLabel(month, year);

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 12px rgba(244,114,182,0.4)" }}
          >
            <i className="fa-solid fa-piggy-bank text-white text-base" />
          </div>
          <div>
            <span
              className="text-xl font-normal leading-none"
              style={{ fontFamily: "var(--font-calistoga)" }}
            >
              PINGO
            </span>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full mono-data capitalize"
              style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
            >
              {label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: "var(--input)" }}
          >
            <i className="fa-solid fa-bell text-sm" style={{ color: "var(--muted-foreground)" }} />
            {alertCat && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "var(--expense)" }}
              />
            )}
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: "var(--primary)" }}
          >
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Alerta de limite */}
      {alertCat && (
        <div className="px-5 mb-3">
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 animate-fade-in-up"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}
          >
            <i className="fa-solid fa-triangle-exclamation animate-pulse-alert text-sm text-expense" />
            <p className="text-xs font-medium text-expense flex-1">
              {alertCat.name} em {alertCat.limit ? Math.round((alertCat.amount / alertCat.limit) * 100) : 0}% do limite mensal
            </p>
            <i className="fa-solid fa-chevron-right text-xs text-expense opacity-60" />
          </div>
        </div>
      )}

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        <BalanceCard
          balance={balance}
          income={income}
          expense={expense}
          userName={userName}
        />

        {categorySummary.length > 0 && (
          <CategoryBar categories={categorySummary} total={totalExpense} />
        )}

        {/* Ação rápida — pinga no porquinho */}
        <Link
          href="/lancamento"
          className="card-pingo flex items-center gap-4 active:scale-95 transition-transform no-underline"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", border: "none" }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center relative"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <i className="fa-solid fa-piggy-bank text-white text-lg" />
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: "var(--gold)", color: "#100A18" }}
            >
              +
            </span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Pingar no porquinho</p>
            <p className="text-xs text-white/70">Diga o que gastou ou recebeu</p>
          </div>
          <i className="fa-solid fa-arrow-right text-white/80" />
        </Link>

        <TransactionList transactions={transactions} />
      </div>

      <BottomNav />
    </main>
  );
}
