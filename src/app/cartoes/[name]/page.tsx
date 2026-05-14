import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import CardDetailClient from "./CardDetailClient";
import Link from "next/link";
import { MONTH_NAMES } from "@/lib/formatters";
import { parseMonthParam } from "@/lib/month-utils";

export default async function CardDetailPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams?: { m?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cardName = decodeURIComponent(params.name);
  const { month, year } = parseMonthParam(searchParams?.m);
  const now = new Date();

  // ── 1. All transactions for this card (12 months back + 12 months forward)
  const past = new Date(now);
  past.setFullYear(past.getFullYear() - 1);
  const future = new Date(now);
  future.setFullYear(future.getFullYear() + 2);

  const { data: txRows } = await supabase
    .from("transactions")
    .select("id,description,amount,type,category_id,date,installments,installment_current,installment_group_id,is_recurring,subcategory,account_type")
    .eq("user_id", user.id)
    .eq("account_name", cardName)
    .gte("date", past.toISOString().split("T")[0])
    .lte("date", future.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (!txRows) notFound();

  const allTransactions = txRows.map(t => ({
    id:                   t.id,
    description:          t.description,
    amount:               Number(t.amount),
    type:                 t.type,
    category_id:          t.category_id ?? null,
    date:                 t.date,
    installments:         t.installments ?? null,
    installment_current:  t.installment_current ?? null,
    installment_group_id: t.installment_group_id ?? null,
    is_recurring:         t.is_recurring ?? null,
    subcategory:          t.subcategory ?? null,
  }));

  const cardType = txRows[0]?.account_type ?? "credit_card";

  // ── 2. Card settings
  const { data: settings } = await supabase
    .from("card_settings")
    .select("credit_limit,due_day,closing_day,color")
    .eq("user_id", user.id)
    .eq("account_name", cardName)
    .maybeSingle();

  // ── 3. Future faturas (next 6 months, committed)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const futureTx = allTransactions.filter(t => {
    const d = new Date(t.date + "T12:00:00");
    return t.type === "expense" && d >= nextMonthStart;
  });

  const futureMap = new Map<string, { year: number; month: number; committed: number }>();
  futureTx.forEach(t => {
    const d = new Date(t.date + "T12:00:00");
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (!futureMap.has(key)) futureMap.set(key, { year: y, month: m, committed: 0 });
    futureMap.get(key)!.committed += t.amount;
  });

  const futureFaturas = Array.from(futureMap.values())
    .sort((a, b) => `${a.year}-${String(a.month).padStart(2,"0")}`.localeCompare(`${b.year}-${String(b.month).padStart(2,"0")}`))
    .slice(0, 6)
    .map(f => ({
      key:       `${f.year}-${String(f.month).padStart(2,"0")}`,
      label:     `${MONTH_NAMES[f.month - 1]}/${String(f.year).slice(2)}`,
      committed: f.committed,
    }));

  // ── 4. Installment series (active)
  const today = now.toISOString().split("T")[0];

  const groupMap = new Map<string, {
    description: string;
    total: number;
    monthlyAmount: number;
    allDates: string[];
    paidDates: string[];
  }>();

  allTransactions
    .filter(t => t.installment_group_id && (t.installments ?? 0) > 1)
    .forEach(t => {
      const gid = t.installment_group_id!;
      if (!groupMap.has(gid)) {
        groupMap.set(gid, {
          description:   t.description.replace(/\s*\(\d+\/\d+\)\s*$/, ""),
          total:         t.installments!,
          monthlyAmount: t.amount,
          allDates:      [],
          paidDates:     [],
        });
      }
      const g = groupMap.get(gid)!;
      g.allDates.push(t.date);
      if (t.date <= today) g.paidDates.push(t.date);
    });

  const installmentSeries = Array.from(groupMap.entries())
    .filter(([, g]) => g.paidDates.length < g.total) // still has unpaid
    .map(([groupId, g]) => {
      const paid       = g.paidDates.length;
      const remaining  = g.total - paid;
      const futureDates = g.allDates.filter(d => d > today).sort();
      return {
        groupId,
        description:           g.description,
        totalInstallments:     g.total,
        paidInstallments:      paid,
        remainingInstallments: remaining,
        monthlyAmount:         g.monthlyAmount,
        totalAmount:           g.total * g.monthlyAmount,
        paidAmount:            paid * g.monthlyAmount,
        remainingAmount:       remaining * g.monthlyAmount,
        nextDate:              futureDates[0] ?? null,
      };
    })
    .sort((a, b) => b.remainingAmount - a.remainingAmount);

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <Link href="/cartoes"
          className="w-9 h-9 rounded-xl flex items-center justify-center no-underline flex-shrink-0"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-arrow-left text-sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{cardName}</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {cardType === "credit_card" ? "Cartão de crédito" : "Conta corrente"}
            {settings?.due_day ? ` · vence dia ${settings.due_day}` : ""}
          </p>
        </div>
        <Link href={`/cartoes?settings=${encodeURIComponent(cardName)}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center no-underline"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-gear text-sm" style={{ color: "var(--muted-foreground)" }} />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <CardDetailClient
          cardName={cardName}
          cardType={cardType}
          settings={settings ?? null}
          allTransactions={allTransactions}
          futureFaturas={futureFaturas}
          installmentSeries={installmentSeries}
          month={month}
          year={year}
          userId={user.id}
        />
      </div>

      <BottomNav />
    </main>
  );
}
