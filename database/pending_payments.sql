-- Pending Payments Table
-- Stores card funding requests that are being processed by VFD
-- Once completed, the payment is removed and balance is updated

CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'card',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON pending_payments(reference);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);

-- Enable RLS for security
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own pending payments" ON pending_payments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own pending payments" ON pending_payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own pending payments" ON pending_payments
  FOR UPDATE USING (auth.uid()::text = user_id);
