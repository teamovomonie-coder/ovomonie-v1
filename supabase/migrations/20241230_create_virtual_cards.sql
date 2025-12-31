-- Create card_requests table first (referenced by virtual_cards)
CREATE TABLE IF NOT EXISTS card_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('PHYSICAL', 'VIRTUAL')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  request_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create virtual_cards table
CREATE TABLE IF NOT EXISTS virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vfd_card_id TEXT NOT NULL,
  masked_pan TEXT NOT NULL,
  expiry_month TEXT NOT NULL,
  expiry_year TEXT NOT NULL,
  card_name TEXT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL,
  request_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT virtual_cards_pkey PRIMARY KEY (id),
  CONSTRAINT virtual_cards_vfd_card_id_key UNIQUE (vfd_card_id),
  CONSTRAINT virtual_cards_request_id_fkey FOREIGN KEY (request_id) REFERENCES card_requests (id),
  CONSTRAINT virtual_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT virtual_cards_status_check CHECK (
    status = ANY (ARRAY['pending'::text, 'active'::text, 'blocked'::text, 'failed'::text])
  )
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS one_active_card_per_user_idx ON virtual_cards USING btree (user_id) 
WHERE (status = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_virtual_cards_vfd_id ON virtual_cards USING btree (vfd_card_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON virtual_cards USING btree (status);
CREATE INDEX IF NOT EXISTS idx_card_requests_user_id ON card_requests USING btree (user_id);

-- Enable RLS
ALTER TABLE card_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_requests
CREATE POLICY card_requests_select ON card_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY card_requests_insert ON card_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY card_requests_update ON card_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for virtual_cards
CREATE POLICY virtual_cards_select ON virtual_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY virtual_cards_insert ON virtual_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY virtual_cards_update ON virtual_cards
  FOR UPDATE USING (auth.uid() = user_id);