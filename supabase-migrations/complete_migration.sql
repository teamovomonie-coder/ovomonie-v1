-- Complete Supabase Migration
-- Migrates all data structures from Firestore to Supabase

-- Financial Transactions Table
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount BIGINT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    narration TEXT,
    party JSONB,
    balance_after BIGINT,
    memo_message TEXT,
    memo_image_uri TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_timestamp ON financial_transactions(timestamp);

-- Notifications Table (if not exists, add missing columns)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT,
    amount BIGINT,
    reference TEXT,
    sender_name TEXT,
    sender_phone TEXT,
    sender_account TEXT,
    recipient_name TEXT,
    recipient_phone TEXT,
    recipient_account TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
