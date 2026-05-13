-- PINGO Schema v3
-- Run this in Supabase SQL Editor

-- Add is_shared column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;

-- Card settings (limit, due day per account)
CREATE TABLE IF NOT EXISTS card_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_name text NOT NULL,
  credit_limit numeric DEFAULT 0,
  due_day int DEFAULT 10,
  color text DEFAULT '#F472B6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_name)
);
ALTER TABLE card_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own card_settings" ON card_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  icon text DEFAULT 'fa-piggy-bank',
  color text DEFAULT '#F472B6',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own savings_goals" ON savings_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark',
  partner_email text,
  monthly_income_goal numeric DEFAULT 0,
  emergency_fund_months int DEFAULT 6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Investments
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'renda_fixa',
  amount numeric NOT NULL DEFAULT 0,
  purchased_at date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own investments" ON investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shared ON transactions(user_id, is_shared) WHERE is_shared = true;
