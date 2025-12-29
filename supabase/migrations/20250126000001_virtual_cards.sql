-- Virtual Card System Tables
-- Ensures idempotency, prevents double spending, and maintains audit trail

-- Card requests table (prevents double creation)
CREATE TABLE IF NOT EXISTS card_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('initiated', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_requests_user_id ON card_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_card_requests_reference ON card_requests(reference);
CREATE INDEX IF NOT EXISTS idx_card_requests_status ON card_requests(status);

-- Virtual cards table
CREATE TABLE IF NOT EXISTS virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vfd_card_id TEXT NOT NULL UNIQUE,
    masked_pan TEXT NOT NULL,
    expiry_month TEXT NOT NULL,
    expiry_year TEXT NOT NULL,
    card_name TEXT,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'blocked', 'failed')),
    request_id UUID REFERENCES card_requests(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index to ensure only one active card per user
CREATE UNIQUE INDEX IF NOT EXISTS one_active_card_per_user_idx
ON virtual_cards(user_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_vfd_id ON virtual_cards(vfd_card_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON virtual_cards(status);

-- Card transactions table (for audit trail)
CREATE TABLE IF NOT EXISTS card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES virtual_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('creation_fee', 'refund', 'purchase', 'reversal')),
    amount_kobo BIGINT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_reference ON card_transactions(reference);

-- Function to create virtual card with atomic wallet deduction
CREATE OR REPLACE FUNCTION create_virtual_card_request(
    p_user_id UUID,
    p_reference TEXT,
    p_card_fee_kobo BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_request_id UUID;
    v_result JSON;
BEGIN
    -- Lock user row
    SELECT * INTO v_user
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if user already has active card
    IF EXISTS (
        SELECT 1 FROM virtual_cards 
        WHERE user_id = p_user_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'User already has an active virtual card';
    END IF;

    -- Check if request already exists
    IF EXISTS (
        SELECT 1 FROM card_requests 
        WHERE reference = p_reference
    ) THEN
        RAISE EXCEPTION 'Duplicate request reference';
    END IF;

    -- Check balance
    IF v_user.balance < p_card_fee_kobo THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Create request record
    INSERT INTO card_requests (user_id, reference, status)
    VALUES (p_user_id, p_reference, 'initiated')
    RETURNING id INTO v_request_id;

    -- Deduct fee from wallet (lock funds)
    UPDATE users
    SET balance = balance - p_card_fee_kobo, updated_at = NOW()
    WHERE id = p_user_id;

    -- Update request to processing
    UPDATE card_requests
    SET status = 'processing', updated_at = NOW()
    WHERE id = v_request_id;

    -- Create transaction record
    INSERT INTO card_transactions (
        card_id, user_id, transaction_type, amount_kobo, 
        reference, status, metadata
    ) VALUES (
        NULL, p_user_id, 'creation_fee', p_card_fee_kobo,
        p_reference || '-fee', 'completed',
        jsonb_build_object('request_id', v_request_id)
    );

    v_result := json_build_object(
        'request_id', v_request_id,
        'new_balance', v_user.balance - p_card_fee_kobo,
        'status', 'processing'
    );

    RETURN v_result;
END;
$$;

-- Function to complete card creation (after VFD success)
CREATE OR REPLACE FUNCTION complete_virtual_card_creation(
    p_request_id UUID,
    p_vfd_card_id TEXT,
    p_masked_pan TEXT,
    p_expiry_month TEXT,
    p_expiry_year TEXT,
    p_card_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_card_id UUID;
    v_result JSON;
BEGIN
    -- Get request
    SELECT * INTO v_request
    FROM card_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    IF v_request.status != 'processing' THEN
        RAISE EXCEPTION 'Request not in processing state';
    END IF;

    -- Create virtual card
    INSERT INTO virtual_cards (
        user_id, vfd_card_id, masked_pan, expiry_month, 
        expiry_year, card_name, status, request_id
    ) VALUES (
        v_request.user_id, p_vfd_card_id, p_masked_pan, 
        p_expiry_month, p_expiry_year, p_card_name, 'active', p_request_id
    )
    RETURNING id INTO v_card_id;

    -- Update request status
    UPDATE card_requests
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_request_id;

    -- Update transaction with card_id
    UPDATE card_transactions
    SET card_id = v_card_id
    WHERE reference = v_request.reference || '-fee';

    v_result := json_build_object(
        'card_id', v_card_id,
        'status', 'active'
    );

    RETURN v_result;
END;
$$;

-- Function to refund on failure
CREATE OR REPLACE FUNCTION refund_card_creation(
    p_request_id UUID,
    p_error_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_fee_amount BIGINT;
    v_result JSON;
BEGIN
    -- Get request
    SELECT * INTO v_request
    FROM card_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    -- Get fee amount
    SELECT amount_kobo INTO v_fee_amount
    FROM card_transactions
    WHERE reference = v_request.reference || '-fee'
    AND transaction_type = 'creation_fee';

    -- Refund to wallet
    UPDATE users
    SET balance = balance + v_fee_amount, updated_at = NOW()
    WHERE id = v_request.user_id;

    -- Update request
    UPDATE card_requests
    SET status = 'failed', error_message = p_error_message, updated_at = NOW()
    WHERE id = p_request_id;

    -- Create refund transaction
    INSERT INTO card_transactions (
        card_id, user_id, transaction_type, amount_kobo,
        reference, status, metadata
    ) VALUES (
        NULL, v_request.user_id, 'refund', v_fee_amount,
        v_request.reference || '-refund', 'completed',
        jsonb_build_object('request_id', p_request_id, 'reason', p_error_message)
    );

    v_result := json_build_object(
        'refunded', true,
        'amount', v_fee_amount
    );

    RETURN v_result;
END;
$$;
