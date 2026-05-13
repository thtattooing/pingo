import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import CartoesClient from "./CartoesClient";

export default async function CartoesPage({
  searchParams,
}: {
  searchParams?: { settings?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now    = new Date();
  const mStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mEnd   = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

  // Next month for preview
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMEnd      = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const nextStart     = nextMonthDate.toISOString().split("T")[0];
  const nextEnd       = nextMEnd.toISOString().split("T")[0];

  const [{ data: curTx }, { data: nextTx }, { data: settingsRows }] = await Promise.all([
    // Current month transactions
    supabase.from("transactions")
      .select("account_name,account_type,amount,type")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd),
    // Next month (future installments already scheduled)
    supabase.from("transactions")
      .select("account_name,amount,type")
      .eq("user_id", user.id)
      .gte("date", nextStart).lt("date", nextEnd)
      .eq("type" as never, "expense"),
    // Card settings
    supabase.from("card_settings")
      .select("account_name,credit_limit,due_day,closing_day,color")
      .eq("user_id", user.id),
  ]);

  // Build card map
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

  const cards = Array.from(cardMap.values())
    .sort((a, b) => b.currentFatura - a.currentFatura);

  // settings card to open
  const openSettings = searchParams?.settings
    ? decodeURIComponent(searchParams.settings)
    : null;

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
          Cartões &amp; Contas
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          Toque em um cartão para ver os detalhes
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <CartoesClient
          cards={cards}
          month={now.getMonth() + 1}
          year={now.getFullYear()}
          openSettings={openSettings}
        />
      </div>

      <BottomNav />
    </main>
  );
}
