import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ContasClient from "./ContasClient";
import Link from "next/link";

export default async function ContasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch checking/savings transactions (all time for balance)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: txRaw } = await supabase
    .from("transactions")
    .select("account_name, account_type, amount, type, date, tx_type")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txRows = (txRaw as any[] | null)?.filter((t: any) => t.account_name) ?? [];

  // Fetch bank account metadata (table may not exist if schema v5 not run)
  const { data: accountMeta } = await supabase
    .from("bank_accounts")
    .select("name, type, initial_balance, color, icon")
    .eq("user_id", user.id);

  type AccountData = {
    name: string;
    type: string;
    totalIncome: number;
    totalExpense: number;
    initialBalance: number;
    color: string;
    icon: string;
    txCount: number;
    lastDate: string | null;
  };

  const accountMap = new Map<string, AccountData>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txRows.forEach((t: any) => {
    if (!t.account_name) return;
    // Skip credit cards — those are shown in /cartoes
    if (t.account_type === "credit_card") return;

    if (!accountMap.has(t.account_name)) {
      const meta = (accountMeta ?? []).find(m => m.name === t.account_name);
      accountMap.set(t.account_name, {
        name:           t.account_name,
        type:           t.account_type ?? "checking",
        totalIncome:    0,
        totalExpense:   0,
        initialBalance: meta?.initial_balance ?? 0,
        color:          meta?.color ?? "#8B5CF6",
        icon:           meta?.icon  ?? "fa-building-columns",
        txCount:        0,
        lastDate:       null,
      });
    }

    const a = accountMap.get(t.account_name)!;
    // Exclude transfer_internal from balance (prevents double counting)
    if (t.tx_type !== "transfer_internal") {
      if (t.type === "income") a.totalIncome  += Number(t.amount);
      else                     a.totalExpense += Number(t.amount);
    }
    a.txCount++;
    if (!a.lastDate || t.date > a.lastDate) a.lastDate = t.date;
  });

  const accounts = Array.from(accountMap.values())
    .map(a => ({ ...a, balance: a.initialBalance + a.totalIncome - a.totalExpense }))
    .sort((a, b) => b.txCount - a.txCount);

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <h1 className="text-2xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
            Contas
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Saldo e extrato das suas contas
          </p>
        </div>
        <Link
          href="/importar"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <i className="fa-solid fa-file-arrow-up" />
          Importar
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <ContasClient accounts={accounts} />
      </div>

      <BottomNav />
    </main>
  );
}
