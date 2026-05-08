import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BalanceCard from "@/components/BalanceCard";
import CategoryBar from "@/components/CategoryBar";
import TransactionList from "@/components/TransactionList";
import Link from "next/link";

const SAMPLE_CATEGORIES = [
  { name: "Alimentação",  icon: "fa-utensils",       amount: 680,  limit: 800, color: "#F59E0B" },
  { name: "Transporte",   icon: "fa-car",             amount: 320,  limit: 400, color: "#3B82F6" },
  { name: "Assinaturas",  icon: "fa-tv",              amount: 180,  limit: 200, color: "#14B8A6" },
  { name: "Saúde",        icon: "fa-heart-pulse",     amount: 250,  limit: 300, color: "#EC4899" },
  { name: "Lazer",        icon: "fa-gamepad",         amount: 120,              color: "#A855F7" },
];

const SAMPLE_TRANSACTIONS = [
  { id: "1", description: "iFood - Almoço",    amount: 38.90, type: "expense" as const, category: "alimentacao", date: new Date().toISOString() },
  { id: "2", description: "Salário Maio",      amount: 4500,  type: "income"  as const, category: "salario",     date: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", description: "Uber - Trabalho",   amount: 24.50, type: "expense" as const, category: "transporte",  date: new Date(Date.now() - 86400000).toISOString() },
  { id: "4", description: "Netflix",           amount: 55.90, type: "expense" as const, category: "assinaturas", date: new Date(Date.now() - 172800000).toISOString() },
  { id: "5", description: "Freelance design",  amount: 800,   type: "income"  as const, category: "freelance",   date: new Date(Date.now() - 259200000).toISOString() },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userName = user.user_metadata?.full_name ?? user.email ?? "você";
  const income  = SAMPLE_TRANSACTIONS.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
  const expense = SAMPLE_TRANSACTIONS.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
  const balance = income - expense;
  const totalExpense = SAMPLE_CATEGORIES.reduce((s, c) => s + c.amount, 0);

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
              className="ml-2 text-xs px-2 py-0.5 rounded-full mono-data"
              style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
            >
              Maio 2026
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: "var(--input)" }}
          >
            <i className="fa-solid fa-bell text-sm" style={{ color: "var(--muted-foreground)" }} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "var(--expense)" }}
            />
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

      {/* Alerta */}
      <div className="px-5 mb-3">
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 animate-fade-in-up"
          style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <i className="fa-solid fa-triangle-exclamation animate-pulse-alert text-sm text-expense" />
          <p className="text-xs font-medium text-expense flex-1">
            Alimentação em 85% do limite mensal
          </p>
          <i className="fa-solid fa-chevron-right text-xs text-expense opacity-60" />
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        <BalanceCard
          balance={balance}
          income={income}
          expense={expense}
          userName={userName}
        />

        <CategoryBar categories={SAMPLE_CATEGORIES} total={totalExpense} />

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

        <TransactionList transactions={SAMPLE_TRANSACTIONS} />
      </div>

      <BottomNav />
    </main>
  );
}
