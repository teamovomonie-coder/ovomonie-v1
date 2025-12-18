-- Fix virtual accounts foreign key constraint issue
-- Run this in Supabase SQL Editor

-- Remove foreign key constraints
ALTER TABLE virtual_accounts DROP CONSTRAINT IF EXISTS virtual_accounts_user_id_fkey;
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;

-- Recreate tables without foreign keys if needed
DROP TABLE IF EXISTS virtual_accounts CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;

-- Virtual accounts table (no foreign key)
CREATE TABLE virtual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    vfd_account_number TEXT NOT NULL UNIQUE,
    reference TEXT NOT NULL UNIQUE,
    amount TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
    validity_time TEXT NOT NULL DEFAULT '4320',
    merchant_name TEXT NOT NULL DEFAULT 'Ovomonie',
    merchant_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions table (no foreign key)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    vfd_account_number TEXT,
    reference TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount BIGINT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    vfd_transaction_id TEXT,
    session_id TEXT,
    sender_name TEXT,
    recipient_account TEXT,
    recipient_bank TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX idx_virtual_accounts_vfd_account ON virtual_accounts(vfd_account_number);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference);

-- RLS Policies
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access virtual_accounts" ON virtual_accounts
    FOR ALL USING (true);

CREATE POLICY "Service role full access wallet_transactions" ON wallet_transactions
    FOR ALL USING (true);