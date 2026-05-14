import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";
import BottomNav        from "@/components/BottomNav";
import ContaDetailClient from "./ContaDetailClient";

export default async function ContaDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { name } = await params;
  const accountName = decodeURIComponent(name);

  // Fetch all transactions for this account
  const { data: txRows } = await supabase
    .from("transactions")
    .select("id, description, amount, type, category_id, date, tx_type, installments, installment_current, is_recurring")
    .eq("user_id", user.id)
    .eq("account_name" as never, accountName)
    .order("date", { ascending: false });

  // Fetch account metadata
  const { data: meta } = await supabase
    .from("bank_accounts")
    .select("name, type, initial_balance, color, icon, notes")
    .eq("user_id", user.id)
    .eq("name", accountName)
    .maybeSingle();

  const accountType = (meta?.type ?? "checking") as "checking" | "savings";

  // Calculate balance
  const initialBalance = meta?.initial_balance ?? 0;
  let totalIncome = 0;
  let totalExpense = 0;

  (txRows ?? []).forEach(t => {
    if (t.tx_type === "transfer_internal") return;
    if (t.type === "income") totalIncome  += Number(t.amount);
    else                     totalExpense += Number(t.amount);
  });

  const currentBalance = initialBalance + totalIncome - totalExpense;

  // Build transactions with safe field access
  const transactions = (txRows ?? []).map(t => ({
    id:                 t.id as string,
    description:        t.description as string,
    amount:             Number(t.amount),
    type:               t.type as "income" | "expense",
    categoryId:         (t.category_id ?? "outros") as string,
    date:               t.date as string,
    txType:             (t.tx_type ?? "unknown") as string,
    installments:       (t.installments as number | null) ?? 1,
    installmentCurrent: (t.installment_current as number | null) ?? 1,
    isRecurring:        Boolean(t.is_recurring),
  }));

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <ContaDetailClient
        accountName={accountName}
        accountType={accountType}
        color={meta?.color ?? "#8B5CF6"}
        icon={meta?.icon  ?? "fa-building-columns"}
        initialBalance={initialBalance}
        currentBalance={currentBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        transactions={transactions}
      />
      <BottomNav />
    </main>
  );
}
