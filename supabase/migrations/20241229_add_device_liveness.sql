-- Add liveness check setting to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS liveness_check_enabled BOOLEAN DEFAULT true;

-- Drop table if exists to avoid conflicts
DROP TABLE IF EXISTS user_devices;

-- Create user_devices table for device tracking
CREATE TABLE user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  is_trusted BOOLEAN DEFAULT false,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  liveness_verified BOOLEAN DEFAULT false,
  liveness_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- Create index for faster lookups
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON user_devices(device_fingerprint);

-- Add RLS policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_devices_select ON user_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_devices_insert ON user_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_devices_update ON user_devices
  FOR UPDATE USING (auth.uid() = user_id);