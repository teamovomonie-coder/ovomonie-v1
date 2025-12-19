-- Verify and fix balance column in users table
-- Run this in Supabase SQL Editor

-- Check if balance column exists and is correct type
DO $$
BEGIN
    -- Ensure balance column exists as bigint (for kobo)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'balance'
    ) THEN
        ALTER TABLE users ADD COLUMN balance BIGINT DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added balance column to users table';
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to users table';
    END IF;
END $$;

-- Create index on balance for faster queries
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('balance', 'updated_at', 'id', 'phone', 'account_number')
ORDER BY ordinal_position;

-- Check sample data
SELECT 
    id, 
    phone, 
    account_number, 
    balance, 
    updated_at
FROM users
LIMIT 5;
