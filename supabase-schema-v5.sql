-- PINGO Schema v5 — tx_type e dedup_hash
-- Run this in Supabase SQL Editor

-- tx_type: tipo classificado da transação (pix_in, pix_out, salary, boleto, etc.)
-- Usado para filtrar transferências internas (não contabilizar como renda/despesa)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS tx_type text DEFAULT 'unknown';

-- dedup_hash: hash de deduplicação para evitar importar o mesmo extrato duas vezes
-- Formato: "YYYY-MM-DD-valor-inicio_descricao"
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS dedup_hash text;

-- Índice único para o upsert de importação
-- Permite ON CONFLICT (user_id, account_name, dedup_hash) DO NOTHING
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedup
  ON public.transactions(user_id, account_name, dedup_hash)
  WHERE dedup_hash IS NOT NULL AND account_name IS NOT NULL;

-- Índice para busca por tx_type (filtra transfer_internal no dashboard)
CREATE INDEX IF NOT EXISTS idx_transactions_txtype
  ON public.transactions(user_id, tx_type)
  WHERE tx_type IS NOT NULL;

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
