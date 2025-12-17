-- Virtual Accounts and Wallet System Migration
-- Creates tables for VFD virtual account integration

-- Virtual accounts table
CREATE TABLE IF NOT EXISTS virtual_accounts (
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

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    vfd_account_number TEXT,
    reference TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount BIGINT NOT NULL, -- in kobo
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

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    account_number TEXT UNIQUE NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0, -- in kobo
    login_pin_hash TEXT NOT NULL,
    transaction_pin_hash TEXT,
    kyc_tier INTEGER NOT NULL DEFAULT 1,
    is_agent BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_vfd_account ON virtual_accounts(vfd_account_number);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_status ON virtual_accounts(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type_status ON wallet_transactions(type, status);
CREATE INDEX IF NOT EXISTS idx_users_account_number ON users(account_number);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Function to process inbound transfers atomically
CREATE OR REPLACE FUNCTION process_inbound_transfer(
    p_user_id TEXT,
    p_amount BIGINT,
    p_reference TEXT,
    p_sender_name TEXT,
    p_vfd_account TEXT,
    p_session_id TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update user balance
    UPDATE users 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Insert transaction record
    INSERT INTO wallet_transactions (
        user_id,
        vfd_account_number,
        reference,
        type,
        amount,
        description,
        status,
        session_id,
        sender_name
    ) VALUES (
        p_user_id,
        p_vfd_account,
        p_reference,
        'credit',
        p_amount,
        'Bank transfer from ' || p_sender_name,
        'completed',
        p_session_id,
        p_sender_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to process outbound transfers atomically
CREATE OR REPLACE FUNCTION process_outbound_transfer(
    p_user_id TEXT,
    p_amount BIGINT,
    p_reference TEXT,
    p_recipient_account TEXT,
    p_recipient_bank TEXT,
    p_narration TEXT
) RETURNS VOID AS $$
BEGIN
    -- Check balance
    IF (SELECT balance FROM users WHERE id = p_user_id) < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Update user balance
    UPDATE users 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Insert transaction record
    INSERT INTO wallet_transactions (
        user_id,
        reference,
        type,
        amount,
        description,
        status,
        recipient_account,
        recipient_bank
    ) VALUES (
        p_user_id,
        p_reference,
        'debit',
        p_amount,
        p_narration,
        'pending',
        p_recipient_account,
        p_recipient_bank
    );
END;
$$ LANGUAGE plpgsql;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_virtual_accounts_updated_at
    BEFORE UPDATE ON virtual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to refund failed transfers
CREATE OR REPLACE FUNCTION refund_failed_transfer(
    p_user_id TEXT,
    p_amount BIGINT,
    p_reference TEXT
) RETURNS VOID AS $$
BEGIN
    -- Refund user balance
    UPDATE users 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Mark transaction as failed
    UPDATE wallet_transactions
    SET status = 'failed',
        updated_at = NOW()
    WHERE reference = p_reference;
END;
$$ LANGUAGE plpgsql;