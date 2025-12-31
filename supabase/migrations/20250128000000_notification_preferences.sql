-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Security alerts
    login_alerts BOOLEAN DEFAULT true,
    geo_fencing_alerts BOOLEAN DEFAULT false,
    password_change_alerts BOOLEAN DEFAULT true,
    
    -- Transaction notifications
    debit_alerts BOOLEAN DEFAULT true,
    credit_alerts BOOLEAN DEFAULT true,
    large_transaction_alerts BOOLEAN DEFAULT true,
    failed_transaction_alerts BOOLEAN DEFAULT true,
    
    -- Account updates
    low_balance_alerts BOOLEAN DEFAULT true,
    promotions_offers BOOLEAN DEFAULT false,
    monthly_statements BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Index for performance
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);