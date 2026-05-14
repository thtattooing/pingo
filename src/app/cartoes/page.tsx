import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MonthNav from "@/components/MonthNav";
import CartoesClient from "./CartoesClient";
import { parseMonthParam } from "@/lib/month-utils";

export default async function CartoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ settings?: string; m?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const { month, year } = parseMonthParam(sp?.m);

  const mStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const mEnd   = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // Next month preview (always month+1 of selected)
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;
  const nextStart = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const nextEnd   = nextMonth === 12
    ? `${nextYear + 1}-01-01`
    : `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;

  const todayStr = new Date().toISOString().split("T")[0];
  const future12 = new Date();
  future12.setMonth(future12.getMonth() + 12);
  const future12Str = future12.toISOString().split("T")[0];

  const [{ data: curTx }, { data: nextTx }, { data: settingsRows }, { data: allAccounts }, { data: futureTxRows }] = await Promise.all([
    supabase.from("transactions")
      .select("account_name,account_type,amount,type,tx_type")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd),
    supabase.from("transactions")
      .select("account_name,amount,type")
      .eq("user_id", user.id)
      .gte("date", nextStart).lt("date", nextEnd)
      .eq("type" as never, "expense"),
    supabase.from("card_settings")
      .select("account_name,credit_limit,due_day,closing_day,color,brand,account_type")
      .eq("user_id", user.id),
    supabase.from("transactions")
      .select("account_name,account_type")
      .eq("user_id", user.id)
      .not("account_name", "is", null)
      .limit(1000),
    supabase.from("transactions")
      .select("account_name,amount,date")
      .eq("user_id", user.id)
      .eq("account_type", "credit_card")
      .eq("type", "expense")
      .neq("tx_type", "transfer_internal")
      .gt("date", todayStr)
      .lte("date", future12Str),
  ]);

  type CardData = {
    name: string;
    type: string;
    brand: string;
    currentFatura: number;
    currentCreditos: number;
    currentPayments: number;
    nextFatura: number;
    creditLimit: number;
    dueDay: number;
    closingDay: number;
    color: string;
  };

  const cardMap = new Map<string, CardData>();

  const addCard = (name: string, type: string) => {
    if (!cardMap.has(name)) {
      const s = settingsRows?.find(s => s.account_name === name);
      const resolvedType = s?.account_type ?? type;
      cardMap.set(name, {
        name,
        type:            resolvedType,
        brand:           s?.brand         ?? "visa",
        currentFatura:   0,
        currentCreditos: 0,
        currentPayments: 0,
        nextFatura:      0,
        creditLimit:     s?.credit_limit  ?? 0,
        dueDay:          s?.due_day       ?? 0,
        closingDay:      s?.closing_day   ?? 20,
        color:           s?.color         ?? (resolvedType === "credit_card" ? "#F472B6" : "#8B5CF6"),
      });
    }
  };

  (curTx ?? []).forEach(t => {
    if (!t.account_name) return;
    addCard(t.account_name, t.account_type ?? "checking");
    const c = cardMap.get(t.account_name)!;
    if (t.type === "expense") {
      c.currentFatura += Number(t.amount);
    } else if (t.type === "income" && t.tx_type === "transfer_internal") {
      c.currentPayments += Number(t.amount);
    } else {
      c.currentCreditos += Number(t.amount);
    }
  });

  (nextTx ?? []).forEach(t => {
    if (!t.account_name) return;
    if (!cardMap.has(t.account_name)) addCard(t.account_name, "credit_card");
    cardMap.get(t.account_name)!.nextFatura += Number(t.amount);
  });

  // Garantir que contas com histórico apareçam mesmo sem mov. no mês
  const seenNames = new Set<string>();
  (allAccounts ?? []).forEach(t => {
    if (!t.account_name || seenNames.has(t.account_name)) return;
    seenNames.add(t.account_name);
    addCard(t.account_name, t.account_type ?? "checking");
  });
  // Contas só em card_settings (criadas manualmente, sem transações ainda)
  (settingsRows ?? []).forEach(s => {
    if (!cardMap.has(s.account_name)) addCard(s.account_name, s.account_type ?? "credit_card");
  });

  const _sortToday = new Date();
  const _getDaysLeft = (dueDay: number) => {
    if (dueDay <= 0) return 9999;
    const d = new Date(_sortToday.getFullYear(), _sortToday.getMonth(), dueDay);
    if (d < _sortToday) d.setMonth(d.getMonth() + 1);
    return Math.ceil((d.getTime() - _sortToday.getTime()) / 86400000);
  };

  const cards = Array.from(cardMap.values()).sort((a, b) => {
    if (a.type === "credit_card" && b.type !== "credit_card") return -1;
    if (a.type !== "credit_card" && b.type === "credit_card") return 1;
    if (a.type === "credit_card") return _getDaysLeft(a.dueDay) - _getDaysLeft(b.dueDay);
    return b.currentFatura - a.currentFatura;
  });

  // Calendário de compromissos futuros agrupado por mês
  const futureMap = new Map<string, { total: number; byCard: Map<string, number> }>();
  (futureTxRows ?? []).forEach(t => {
    const mk = (t.date as string).substring(0, 7);
    if (!futureMap.has(mk)) futureMap.set(mk, { total: 0, byCard: new Map() });
    const entry = futureMap.get(mk)!;
    entry.total += Number(t.amount);
    const cardName = t.account_name ?? "outros";
    entry.byCard.set(cardName, (entry.byCard.get(cardName) ?? 0) + Number(t.amount));
  });
  const futureMonths = Array.from(futureMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, { total, byCard }]) => ({
      monthKey,
      total,
      byCard: Array.from(byCard.entries()).map(([name, amount]) => ({
        name,
        amount,
        color: settingsRows?.find(s => s.account_name === name)?.color ?? "#F472B6",
      })),
    }));

  const openSettings = sp?.settings
    ? decodeURIComponent(sp.settings)
    : null;

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-4 flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
            Cartões &amp; Contas
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Toque em um cartão para ver os detalhes
          </p>
        </div>
        <MonthNav month={month} year={year} basePath="/cartoes" />
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <CartoesClient
          cards={cards}
          month={month}
          year={year}
          openSettings={openSettings}
          futureMonths={futureMonths}
        />
      </div>

      <BottomNav />
    </main>
  );
}
