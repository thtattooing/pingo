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
--    Qualquer linha importada com dedup_hash NULL foi salva pelo fallback de schema
--    (o upsert falhou → o código usou um payload mínimo sem account_name/dedup_hash).
--    Estas linhas têm descrições erradas (datas "DD/MM/YYYY" ou nome fixo repetido)
--    e precisam ser reimportadas com o parser corrigido.
DELETE FROM public.transactions
WHERE is_imported = true AND dedup_hash IS NULL;

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
