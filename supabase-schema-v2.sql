-- =============================================
-- PINGO v2 — Adições ao schema (seguro rodar múltiplas vezes)
-- Execute no SQL Editor do Supabase
-- =============================================

-- Novas colunas na tabela transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_type  text DEFAULT 'checking'
    CHECK (account_type IN ('credit_card', 'checking', 'savings', 'other')),
  ADD COLUMN IF NOT EXISTS account_name  text,
  ADD COLUMN IF NOT EXISTS is_recurring  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subcategory   text;

-- Índice para buscas por conta
CREATE INDEX IF NOT EXISTS idx_transactions_account
  ON public.transactions(user_id, account_name);

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
