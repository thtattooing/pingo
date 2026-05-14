-- PINGO Schema v6 — interest_rate em card_settings
-- Run this in Supabase SQL Editor

-- Taxa de juros mensal do cartão (% ao mês, ex: 4.5 = 4,5%/mês)
-- Usado para calcular estratégia de pagamento de dívida (método avalanche)
ALTER TABLE public.card_settings
  ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2);

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
