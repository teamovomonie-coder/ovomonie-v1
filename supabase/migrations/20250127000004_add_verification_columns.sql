-- Add BVN and selfie verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bvn_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS selfie_match_score INTEGER DEFAULT 0;