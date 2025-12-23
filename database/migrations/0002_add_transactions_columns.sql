-- Add party_name and metadata columns to transactions and notifications

-- Add columns if the target tables exist (avoid errors on DBs that don't have legacy tables)
ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS party_name TEXT;

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Ensure notifications has metadata column too
ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Also ensure financial_transactions has party_name (safe no-op if exists)
ALTER TABLE IF EXISTS financial_transactions
  ADD COLUMN IF NOT EXISTS party_name TEXT;

-- End migration
