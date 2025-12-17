-- Create receipt_templates table for bill payment receipt templates
CREATE TABLE IF NOT EXISTS receipt_templates (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  fields TEXT[] NOT NULL DEFAULT '{}',
  color_scheme JSONB NOT NULL DEFAULT '{"primary": "#6366f1", "secondary": "#818cf8", "accent": "#e0e7ff"}',
  icon TEXT NOT NULL DEFAULT 'receipt',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO receipt_templates (id, category, template_name, fields, color_scheme, icon) VALUES
  ('utility-default', 'utility', 'Utility Bill Receipt', 
   ARRAY['meterNumber', 'token', 'units', 'tariff'], 
   '{"primary": "#f59e0b", "secondary": "#fbbf24", "accent": "#fef3c7"}'::jsonb, 
   'zap'),
  
  ('cabletv-default', 'cable tv', 'Cable TV Receipt', 
   ARRAY['smartCardNumber', 'bouquet', 'duration', 'renewalDate'], 
   '{"primary": "#8b5cf6", "secondary": "#a78bfa", "accent": "#ede9fe"}'::jsonb, 
   'tv'),
  
  ('internet-default', 'internet subscription', 'Internet Subscription Receipt', 
   ARRAY['accountNumber', 'package', 'speed', 'validUntil'], 
   '{"primary": "#06b6d4", "secondary": "#22d3ee", "accent": "#cffafe"}'::jsonb, 
   'wifi'),
  
  ('betting-default', 'betting', 'Betting Wallet Receipt', 
   ARRAY['accountId', 'walletBalance', 'bonusAmount'], 
   '{"primary": "#10b981", "secondary": "#34d399", "accent": "#d1fae5"}'::jsonb, 
   'trophy'),
  
  ('water-default', 'water', 'Water Bill Receipt', 
   ARRAY['accountNumber', 'meterReading', 'consumption'], 
   '{"primary": "#3b82f6", "secondary": "#60a5fa", "accent": "#dbeafe"}'::jsonb, 
   'droplet'),
  
  ('generic-default', 'generic', 'Bill Payment Receipt', 
   ARRAY['accountId', 'reference'], 
   '{"primary": "#6366f1", "secondary": "#818cf8", "accent": "#e0e7ff"}'::jsonb, 
   'receipt')
ON CONFLICT (category) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipt_templates_category ON receipt_templates(category);

-- Add RLS policies
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates
CREATE POLICY "Allow authenticated users to read templates"
  ON receipt_templates FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify templates
CREATE POLICY "Allow service role to manage templates"
  ON receipt_templates FOR ALL
  TO service_role
  USING (true);
