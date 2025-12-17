-- Pending Transactions Table
-- This table stores temporary transaction receipts for the success page
-- Run this migration in your Supabase SQL editor if you want database persistence

CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT NOT NULL UNIQUE,
  amount INTEGER,
  data JSONB NOT NULL DEFAULT '{}',
  recipient_name TEXT,
  bank_name TEXT,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_id ON pending_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_reference ON pending_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_status ON pending_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_created_at ON pending_transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE pending_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own transactions
CREATE POLICY "Users can view their own pending transactions"
  ON pending_transactions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own pending transactions"
  ON pending_transactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own pending transactions"
  ON pending_transactions FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own pending transactions"
  ON pending_transactions FOR DELETE
  USING (auth.uid()::text = user_id);
