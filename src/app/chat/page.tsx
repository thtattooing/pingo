import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ChatClient from "./ChatClient";
import Link from "next/link";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const { data: txRows } = await supabase
    .from("transactions")
    .select("amount,type,category_id")
    .eq("user_id", user.id)
    .gte("date", since.toISOString().split("T")[0]);

  const income  = (txRows ?? []).filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = (txRows ?? []).filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const catMap = new Map<string, number>();
  (txRows ?? []).filter(t => t.type === "expense").forEach(t => {
    const k = t.category_id ?? "outros";
    catMap.set(k, (catMap.get(k) ?? 0) + Number(t.amount));
  });
  const topCategory = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "outros";

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/home" className="w-9 h-9 rounded-xl flex items-center justify-center no-underline"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-arrow-left text-sm" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)" }}>
            <i className="fa-solid fa-piggy-bank text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-semibold">Assistente PINGO</p>
            <p className="text-[10px]" style={{ color: "var(--income)" }}>Online · IA Financeira</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatClient income={income} expense={expense} topCategory={topCategory} />
      </div>

      <BottomNav />
    </main>
  );
}
