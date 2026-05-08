import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import CartoesClient from "./CartoesClient";

function parseMonthParam(m?: string): { month: number; year: number } {
  const now = new Date();
  if (m) {
    const [y, mo] = m.split("-").map(Number);
    if (y > 2000 && mo >= 1 && mo <= 12) return { month: mo, year: y };
  }
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default async function CartoesPage({
  searchParams,
}: {
  searchParams?: { m?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { month, year } = parseMonthParam(searchParams?.m);
  const mStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const mEnd   = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // Try with account columns; fall back if schema not migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txRows: any[] | null = null;
  let schemaReady = false;

  {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,description,amount,type,category_id,date,account_name,account_type,subcategory,is_recurring")
      .eq("user_id", user.id)
      .gte("date", mStart).lt("date", mEnd)
      .order("date", { ascending: false });

    if (!error) {
      txRows = data;
      schemaReady = true;
    } else {
      // Columns don't exist yet — run supabase-schema-v2.sql to fix
      const fallback = await supabase
        .from("transactions")
        .select("id,description,amount,type,category_id,date")
        .eq("user_id", user.id)
        .gte("date", mStart).lt("date", mEnd)
        .order("date", { ascending: false });
      txRows = fallback.data;
      schemaReady = false;
    }
  }

  // Group transactions by account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const group = (filter: (t: any) => boolean): { name: string; transactions: any[] }[] => {
    const map = new Map<string, any[]>();
    (txRows ?? []).filter(filter).forEach(t => {
      const key = t.account_name ?? "Sem nome";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([name, transactions]) => ({ name, transactions }));
  };

  const creditCards = schemaReady
    ? group(t => t.account_type === "credit_card")
    : [];
  const checking = schemaReady
    ? group(t => t.account_type !== "credit_card" && t.account_name)
    : [];

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
            Cartões &amp; Contas
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Faturas e extratos por conta
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <CartoesClient
          creditCards={creditCards}
          checking={checking}
          month={month}
          year={year}
          schemaReady={schemaReady}
        />
      </div>

      <BottomNav />
    </main>
  );
}
