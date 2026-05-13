-- PINGO Schema v4 — Cartões inteligentes
-- Run this in Supabase SQL Editor

-- installment_group_id: links all installments of the same purchase
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_group_id uuid;

-- closing_day: day of month when fatura closes (e.g. 20 = closes on 20th, due on next month's due_day)
ALTER TABLE card_settings ADD COLUMN IF NOT EXISTS closing_day int DEFAULT 20;

-- Index for fast installment series lookups
CREATE INDEX IF NOT EXISTS idx_tx_installment_group
  ON transactions(installment_group_id)
  WHERE installment_group_id IS NOT NULL;

-- Index for card detail queries (card + future dates)
CREATE INDEX IF NOT EXISTS idx_tx_account_date
  ON transactions(user_id, account_name, date);
