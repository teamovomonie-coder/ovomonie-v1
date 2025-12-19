-- Create saved_cards table for storing tokenized card information
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Add RLS policies
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cards
CREATE POLICY "Users can view own cards" ON saved_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own cards
CREATE POLICY "Users can insert own cards" ON saved_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cards
CREATE POLICY "Users can update own cards" ON saved_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cards
CREATE POLICY "Users can delete own cards" ON saved_cards
  FOR DELETE USING (auth.uid() = user_id);
