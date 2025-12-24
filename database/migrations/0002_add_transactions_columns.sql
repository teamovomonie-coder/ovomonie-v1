-- Add party_name and metadata columns to transactions and notifications
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS party_name TEXT;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Ensure notifications has metadata column too
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Also ensure financial_transactions has party_name (safe no-op if exists)
ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS party_name TEXT;

-- End migration
