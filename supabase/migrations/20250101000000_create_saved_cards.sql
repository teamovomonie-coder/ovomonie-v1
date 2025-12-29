-- Create saved_cards table for storing tokenized card information
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Remove FK constraint until users table exists
  card_token TEXT NOT NULL,
  last_four VARCHAR(4) NOT NULL,
  card_brand VARCHAR(20) NOT NULL,
  expiry_display VARCHAR(10),
  nickname TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_id ON saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_default ON saved_cards(user_id, is_default) WHERE is_default = true;

-- Note: RLS policies and FK constraints will be added after users table is created
