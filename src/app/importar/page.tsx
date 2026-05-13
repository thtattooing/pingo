import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ImportarClient from "./ImportarClient";

export default async function ImportarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch last 180 days to detect duplicates (covers 6-month statements)
  const since = new Date();
  since.setDate(since.getDate() - 180);

  const { data: recent } = await supabase
    .from("transactions")
    .select("date, amount, description")
    .eq("user_id", user.id)
    .gte("date", since.toISOString().split("T")[0]);

  const recentHashes = (recent ?? []).map(t =>
    `${t.date}-${Number(t.amount).toFixed(2)}-${String(t.description ?? "").slice(0, 15).toLowerCase().replace(/[^a-z0-9]/g, "")}`
  );

  // Existing cards and accounts so the import picker can show them
  const [{ data: cardRows }, { data: accountRows }] = await Promise.all([
    supabase.from("card_settings").select("account_name,color").eq("user_id", user.id),
    supabase.from("bank_accounts").select("name,type").eq("user_id", user.id),
  ]);

  const existingCards    = (cardRows    ?? []).map(r => ({ name: r.account_name, color: r.color ?? "#F472B6" }));
  const existingAccounts = (accountRows ?? []).map(r => ({ name: r.name, type: r.type ?? "checking" }));

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-5">
        <h1
          className="text-2xl font-normal leading-tight"
          style={{ fontFamily: "var(--font-calistoga)" }}
        >
          Importar extrato
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Nubank, Inter, C6 — CSV e OFX
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <ImportarClient
          userId={user.id}
          recentHashes={recentHashes}
          existingCards={existingCards}
          existingAccounts={existingAccounts}
        />
      </div>

      <BottomNav />
    </main>
  );
}
