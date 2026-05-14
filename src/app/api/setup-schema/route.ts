import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Rota de setup único — cria tabelas ausentes com service role
// Acesse: /api/setup-schema?secret=pingo-setup-2026
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== "pingo-setup-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const sql = `
    CREATE TABLE IF NOT EXISTS public.category_rules (
      id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      description_key text NOT NULL,
      category_id     text NOT NULL,
      use_count       int  DEFAULT 1 NOT NULL,
      updated_at      timestamptz DEFAULT now() NOT NULL,
      UNIQUE (user_id, description_key)
    );
    ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'category_rules' AND policyname = 'users can manage own rules'
      ) THEN
        CREATE POLICY "users can manage own rules"
          ON public.category_rules FOR ALL
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS category_rules_user_key
      ON public.category_rules (user_id, description_key);
  `;

  const { error } = await supabase.rpc("exec_sql", { query: sql }).single();

  // exec_sql não existe em todos os projetos — tenta insert de teste como verificação
  const { error: checkError } = await supabase
    .from("category_rules")
    .select("id")
    .limit(1);

  if (checkError && checkError.code !== "PGRST116") {
    return NextResponse.json({
      ok: false,
      message: "Tabela não existe. Cole o SQL do arquivo supabase-category-rules.sql no Supabase Dashboard.",
      sqlFile: "supabase-category-rules.sql",
      error: checkError.message,
    });
  }

  return NextResponse.json({ ok: true, message: "category_rules OK", rpcError: error?.message });
}
