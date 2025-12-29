-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  daily_limit_kobo BIGINT NOT NULL DEFAULT 5000000,
  single_transaction_limit_kobo BIGINT NOT NULL DEFAULT 1500000,
  block_international BOOLEAN NOT NULL DEFAULT false,
  block_gambling BOOLEAN NOT NULL DEFAULT false,
  enable_online_payments BOOLEAN NOT NULL DEFAULT true,
  enable_contactless BOOLEAN NOT NULL DEFAULT true,
  enable_autopay BOOLEAN NOT NULL DEFAULT true,
  require_pin_above_kobo BIGINT NOT NULL DEFAULT 500000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_settings_user_id ON payment_settings(user_id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  amount_kobo BIGINT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_billing_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
