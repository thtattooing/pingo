import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MonthNav from "@/components/MonthNav";
import CartoesClient from "./CartoesClient";
import { parseMonthParam } from "@/lib/month-utils";

export default async function CartoesPage({
  searchParams,
}: {
  searchParams?: { settings?: string; m?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { month, year } = parseMonthParam(searchParams?.m);

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

  const [{ data: curTx }, { data: nextTx }, { data: settingsRows }, { data: allAccounts }] = await Promise.all([
    supabase.from("transactions")
      .select("account_name,account_type,amount,type")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd),
    supabase.from("transactions")
      .select("account_name,amount,type")
      .eq("user_id", user.id)
      .gte("date", nextStart).lt("date", nextEnd)
      .eq("type" as never, "expense"),
    supabase.from("card_settings")
      .select("account_name,credit_limit,due_day,closing_day,color")
      .eq("user_id", user.id),
    // Buscar todos os account_names históricos para mostrar contas sem mov. no mês
    supabase.from("transactions")
      .select("account_name,account_type")
      .eq("user_id", user.id)
      .not("account_name", "is", null)
      .limit(1000),
  ]);

  type CardData = {
    name: string;
    type: string;
    currentFatura: number;
    currentCreditos: number;
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
      cardMap.set(name, {
        name,
        type,
        currentFatura:   0,
        currentCreditos: 0,
        nextFatura:      0,
        creditLimit:     s?.credit_limit  ?? 0,
        dueDay:          s?.due_day       ?? 0,
        closingDay:      s?.closing_day   ?? 20,
        color:           s?.color         ?? (type === "credit_card" ? "#F472B6" : "#8B5CF6"),
      });
    }
  };

  (curTx ?? []).forEach(t => {
    if (!t.account_name) return;
    addCard(t.account_name, t.account_type ?? "checking");
    const c = cardMap.get(t.account_name)!;
    if (t.type === "expense") c.currentFatura   += Number(t.amount);
    else                      c.currentCreditos += Number(t.amount);
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
  // Contas só em card_settings (configuradas mas sem transações ainda)
  (settingsRows ?? []).forEach(s => {
    if (!cardMap.has(s.account_name)) addCard(s.account_name, "credit_card");
  });

  const cards = Array.from(cardMap.values()).sort((a, b) => {
    if (a.type === "credit_card" && b.type !== "credit_card") return -1;
    if (a.type !== "credit_card" && b.type === "credit_card") return 1;
    return b.currentFatura - a.currentFatura;
  });

  const openSettings = searchParams?.settings
    ? decodeURIComponent(searchParams.settings)
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
        />
      </div>

      <BottomNav />
    </main>
  );
}
