-- Add 2FA columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Update existing mfa_enabled column to match two_factor_enabled for consistency
UPDATE users SET two_factor_enabled = mfa_enabled WHERE mfa_enabled IS NOT NULL;

-- Create index for 2FA lookups
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);