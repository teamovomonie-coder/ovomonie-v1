-- Add party_name and metadata columns to transactions and notifications

-- Vercel-friendly: do not use explicit transaction wrappers (BEGIN/COMMIT)
-- Run each ALTER as separate statements; use IF EXISTS so the migration is safe across environments.

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS party_name TEXT;

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE IF EXISTS financial_transactions
  ADD COLUMN IF NOT EXISTS party_name TEXT;

-- End migration
