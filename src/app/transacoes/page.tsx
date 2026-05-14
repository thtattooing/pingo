import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TransacoesClient from "./TransacoesClient";
import MonthNav from "@/components/MonthNav";
import Link from "next/link";
import { parseMonthParam } from "@/lib/month-utils";

export default async function TransacoesPage({
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
  const mEnd   = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txRows: any[] = [];
  {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,description,amount,type,category_id,date,account_type,account_name,is_recurring,subcategory,installments,installment_current,is_shared,tx_type")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd)
      .order("date", { ascending: false })
      .limit(500);

    if (!error && data) {
      txRows = data;
    } else {
      const fallback = await supabase
        .from("transactions")
        .select("id,description,amount,type,category_id,date")
        .eq("user_id", user.id)
        .gte("date", mStart).lt("date", mEnd)
        .order("date", { ascending: false })
        .limit(500);
      txRows = fallback.data ?? [];
    }
  }

  const transactions = txRows.map(t => ({
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
    txType:             t.tx_type ?? undefined,
  }));

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/home" className="w-9 h-9 rounded-xl flex items-center justify-center no-underline"
              style={{ background: "var(--input)" }}>
              <i className="fa-solid fa-arrow-left text-sm" />
            </Link>
            <div>
              <h1 className="text-xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>Transações</h1>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Busque e edite lançamentos</p>
            </div>
          </div>
          <Link href="/importar"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold no-underline"
            style={{ background: "var(--primary)", color: "#fff" }}>
            <i className="fa-solid fa-file-arrow-up text-xs" />
            Importar
          </Link>
        </div>
        <MonthNav month={month} year={year} basePath="/transacoes" />
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <TransacoesClient initialTransactions={transactions} userId={user.id} />
      </div>

      <BottomNav />
    </main>
  );
}
