import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MetasClient from "./MetasClient";

const NECESSITIES_CATS = ["moradia","energia","agua","saude","alimentacao","transporte","educacao"];
const WANTS_CATS       = ["lazer","vestuario","assinaturas","outros"];
// savings = income - necessities - wants

export default async function MetasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const mStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mEnd   = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

  const [{ data: txRows }, { data: goals }, { data: investments }, { data: settings }] = await Promise.all([
    supabase.from("transactions").select("amount,type,category_id").eq("user_id", user.id).gte("date", mStart).lt("date", mEnd),
    supabase.from("savings_goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("investments").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("user_settings").select("emergency_fund_months").eq("user_id", user.id).maybeSingle(),
  ]);

  const tx = txRows ?? [];
  const income  = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const necessities = tx.filter(t => t.type === "expense" && NECESSITIES_CATS.includes(t.category_id ?? ""))
    .reduce((s, t) => s + Number(t.amount), 0);
  const wants = tx.filter(t => t.type === "expense" && WANTS_CATS.includes(t.category_id ?? ""))
    .reduce((s, t) => s + Number(t.amount), 0);
  const savings = Math.max(0, income - expense);

  const totalInvestments = (investments ?? []).reduce((s, i) => s + Number(i.amount), 0);

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
          initialGoals={goals ?? []}
          initialInvestments={investments ?? []}
          budget={{
            income,
            necessities,
            wants,
            savings,
            emergencyMonths: settings?.emergency_fund_months ?? 6,
            monthlyExpense: expense,
          }}
          totalInvestments={totalInvestments}
          incomeMonth={income}
        />
      </div>

      <BottomNav />
    </main>
  );
}
