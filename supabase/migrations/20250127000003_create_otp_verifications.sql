-- Create OTP verification table for phone number verification
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- Add RLS policies
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own OTP records
CREATE POLICY "Users can access own OTP records" ON otp_verifications
  FOR ALL USING (auth.uid() = user_id);