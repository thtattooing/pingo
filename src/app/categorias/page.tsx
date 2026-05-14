import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import CategoriasClient from "./CategoriasClient";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customRows } = await supabase
    .from("custom_categories")
    .select("id,name,icon,color")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const customCategories = (customRows ?? []).map(c => ({
    id: c.id as string,
    name: c.name as string,
    icon: c.icon as string,
    color: c.color as string,
  }));

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      <header className="px-5 pt-12 pb-4 flex items-center gap-3">
        <Link href="/configuracoes" className="w-9 h-9 rounded-xl flex items-center justify-center no-underline"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-arrow-left text-sm" />
        </Link>
        <div>
          <h1 className="text-xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>Categorias</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Gerencie suas categorias</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <CategoriasClient
          builtInCategories={CATEGORIES.map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color }))}
          customCategories={customCategories}
          userId={user.id}
        />
      </div>

      <BottomNav />
    </main>
  );
}
