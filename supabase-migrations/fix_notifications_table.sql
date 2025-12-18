-- Fix notifications table - add missing is_read column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
