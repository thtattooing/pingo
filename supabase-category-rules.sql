-- Etapa 2: Sistema de memória de categorias
-- Cole este SQL no Supabase Dashboard → SQL Editor → New Query → Run

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

CREATE POLICY "users can manage own rules"
  ON public.category_rules
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS category_rules_user_key
  ON public.category_rules (user_id, description_key);
