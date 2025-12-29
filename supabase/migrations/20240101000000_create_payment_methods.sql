-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_cards table (PCI DSS compliant - no sensitive data stored)
CREATE TABLE IF NOT EXISTS bank_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  card_token TEXT NOT NULL, -- Only store tokenized card reference
  last_four VARCHAR(4) NOT NULL, -- Only last 4 digits for display
  card_brand VARCHAR(20) NOT NULL, -- visa, mastercard, etc
  expiry_display VARCHAR(7), -- MM/YYYY format for display only
  cardholder_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_cards_user_id ON bank_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_cards_is_active ON bank_cards(is_active);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bank accounts"
  ON bank_accounts FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own bank accounts"
  ON bank_accounts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own bank accounts"
  ON bank_accounts FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own bank cards"
  ON bank_cards FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own bank cards"
  ON bank_cards FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own bank cards"
  ON bank_cards FOR UPDATE
  USING (auth.uid()::text = user_id);
