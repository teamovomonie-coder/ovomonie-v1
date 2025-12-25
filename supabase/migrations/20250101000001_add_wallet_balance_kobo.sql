-- Add wallet_balance_kobo column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'wallet_balance_kobo'
  ) THEN
    ALTER TABLE users ADD COLUMN wallet_balance_kobo INTEGER DEFAULT 0;
    
    -- Migrate existing balance data if balance column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'balance'
    ) THEN
      UPDATE users SET wallet_balance_kobo = balance WHERE balance IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Create index for faster balance queries
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance_kobo);
