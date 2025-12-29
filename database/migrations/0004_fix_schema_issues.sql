-- Fix Schema Issues Migration
-- Addresses critical and high priority database schema problems

-- 1. Fix data type inconsistencies
ALTER TABLE IF EXISTS inventory_transactions 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- 2. Add NOT NULL constraints where missing
ALTER TABLE IF EXISTS inventory_products 
  ALTER COLUMN unit_price SET NOT NULL,
  ALTER COLUMN cost_price SET NOT NULL;

-- 3. Standardize user_id columns to UUID
ALTER TABLE IF EXISTS savings_goals 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

ALTER TABLE IF EXISTS budgets 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

ALTER TABLE IF EXISTS crypto_assets 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

ALTER TABLE IF EXISTS insurance 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

ALTER TABLE IF EXISTS referrals 
  ALTER COLUMN referrer_id TYPE UUID USING referrer_id::UUID,
  ALTER COLUMN referee_id TYPE UUID USING referee_id::UUID;

ALTER TABLE IF EXISTS loyalty_points 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- 4. Add unique constraint for currency rates
ALTER TABLE IF EXISTS currency_rates 
  ADD CONSTRAINT unique_currency_pair UNIQUE (from_currency, to_currency);

-- 5. Enable RLS on financial tables
ALTER TABLE IF EXISTS pending_payments ENABLE ROW LEVEL SECURITY;

-- End migration