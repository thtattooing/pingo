-- Custom categories table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.custom_categories (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  icon       text NOT NULL DEFAULT 'fa-tag',
  color      text NOT NULL DEFAULT '#64748B',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own custom categories"
  ON public.custom_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS custom_categories_user_idx ON public.custom_categories (user_id);
