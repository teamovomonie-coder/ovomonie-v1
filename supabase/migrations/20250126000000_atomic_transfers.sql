-- Atomic internal transfer function to prevent race conditions
CREATE OR REPLACE FUNCTION process_internal_transfer(
    p_sender_id UUID,
    p_recipient_account TEXT,
    p_amount_kobo BIGINT,
    p_narration TEXT,
    p_reference TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender RECORD;
    v_recipient RECORD;
    v_new_sender_balance BIGINT;
    v_new_recipient_balance BIGINT;
    v_result JSON;
BEGIN
    -- Lock sender row for update
    SELECT * INTO v_sender
    FROM users
    WHERE id = p_sender_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sender not found';
    END IF;

    -- Lock recipient row for update
    SELECT * INTO v_recipient
    FROM users
    WHERE account_number = p_recipient_account
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recipient not found';
    END IF;

    -- Check self-transfer
    IF v_sender.account_number = p_recipient_account THEN
        RAISE EXCEPTION 'Cannot transfer to yourself';
    END IF;

    -- Check for duplicate transaction
    IF EXISTS (SELECT 1 FROM financial_transactions WHERE reference = p_reference) THEN
        RAISE EXCEPTION 'Duplicate transaction';
    END IF;

    -- Check balance
    IF v_sender.balance < p_amount_kobo THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Calculate new balances
    v_new_sender_balance := v_sender.balance - p_amount_kobo;
    v_new_recipient_balance := v_recipient.balance + p_amount_kobo;

    -- Update sender balance
    UPDATE users
    SET balance = v_new_sender_balance, updated_at = NOW()
    WHERE id = p_sender_id;

    -- Update recipient balance
    UPDATE users
    SET balance = v_new_recipient_balance, updated_at = NOW()
    WHERE id = v_recipient.id;

    -- Create debit transaction
    INSERT INTO financial_transactions (
        user_id, category, type, amount, reference, narration, 
        party_name, party_account, balance_after, timestamp
    ) VALUES (
        p_sender_id, 'transfer', 'debit', p_amount_kobo, p_reference || '-debit',
        p_narration, v_recipient.full_name, v_recipient.account_number,
        v_new_sender_balance, NOW()
    );

    -- Create credit transaction
    INSERT INTO financial_transactions (
        user_id, category, type, amount, reference, narration,
        party_name, party_account, balance_after, timestamp
    ) VALUES (
        v_recipient.id, 'transfer', 'credit', p_amount_kobo, p_reference || '-credit',
        p_narration, v_sender.full_name, v_sender.account_number,
        v_new_recipient_balance, NOW()
    );

    -- Create notifications
    INSERT INTO notifications (user_id, title, body, category, created_at)
    VALUES (
        p_sender_id, 'Money Sent',
        '₦' || (p_amount_kobo / 100.0)::TEXT || ' sent to ' || v_recipient.full_name,
        'transaction', NOW()
    );

    INSERT INTO notifications (user_id, title, body, category, created_at)
    VALUES (
        v_recipient.id, 'Money Received',
        '₦' || (p_amount_kobo / 100.0)::TEXT || ' received from ' || v_sender.full_name,
        'transaction', NOW()
    );

    -- Return result
    v_result := json_build_object(
        'new_sender_balance', v_new_sender_balance,
        'recipient_name', v_recipient.full_name
    );

    RETURN v_result;
END;
$$;
