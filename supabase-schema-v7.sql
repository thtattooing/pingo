-- PINGO Schema v7 — corrige índice de dedup e limpa importações com erro
-- Execute no Supabase SQL Editor

-- 1. Substitui índice parcial por índice completo
--    O índice parcial (WHERE dedup_hash IS NOT NULL AND account_name IS NOT NULL)
--    não pode ser usado pelo PostgREST como conflict target no upsert.
--    O índice não-parcial abaixo permite ON CONFLICT (user_id, account_name, dedup_hash)
--    funcionar corretamente. NULLs continuam permitidos pois NULL != NULL no PostgreSQL.
DROP INDEX IF EXISTS idx_transactions_dedup;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedup
  ON public.transactions(user_id, account_name, dedup_hash);

-- 2. Remove transações importadas com erro de parser
--    Estas linhas têm description = "DD/MM/YYYY" (o parser leu a coluna de data
--    errada como descrição), account_name NULL (o fallback de schema foi acionado)
--    e dedup_hash NULL (confirmando que o upsert falhou e o fallback foi usado).
--    As transações reais precisam ser reimportadas com o parser corrigido.
DELETE FROM public.transactions
WHERE
  is_imported = true
  AND dedup_hash IS NULL
  AND description ~ '^\d{1,2}/\d{2}/\d{4}$';

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
