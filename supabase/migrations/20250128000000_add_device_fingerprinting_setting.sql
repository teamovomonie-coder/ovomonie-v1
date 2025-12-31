-- Add device fingerprinting setting to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprinting_enabled BOOLEAN DEFAULT true;

-- Add device metadata columns to user_devices table for better device management
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS location TEXT;

