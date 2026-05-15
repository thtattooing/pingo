-- PINGO Schema v8 — adiciona coluna installment_group_id que faltava
-- Execute no Supabase SQL Editor

-- Esta coluna estava na migration v4 mas não foi aplicada ao banco.
-- Sem ela o upsert de importação falha com PGRST204, que dispara o
-- fallback sem account_name → tudo vai para conta geral / null.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS installment_group_id uuid;

-- Força refresh do schema cache do PostgREST para reconhecer a coluna
NOTIFY pgrst, 'reload schema';

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
