-- Atomic transfer function for Supabase
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION perform_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount BIGINT,
  p_reference TEXT,
  p_narration TEXT,
  p_sender_name TEXT,
  p_recipient_name TEXT,
  p_sender_account TEXT,
  p_recipient_account TEXT,
  p_memo_message TEXT DEFAULT NULL,
  p_memo_image TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender_balance BIGINT;
  v_recipient_balance BIGINT;
BEGIN
  -- Lock rows to prevent race conditions
  SELECT balance INTO v_sender_balance
  FROM users
  WHERE id = p_sender_id
  FOR UPDATE;

  SELECT balance INTO v_recipient_balance
  FROM users
  WHERE id = p_recipient_id
  FOR UPDATE;

  -- Check sender has sufficient balance
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Update balances
  UPDATE users
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_sender_id;

  UPDATE users
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_recipient_id;

  -- Create debit transaction
  INSERT INTO financial_transactions (
    user_id, category, type, amount, reference, narration,
    party_name, party_account, party_bank, balance_after,
    memo_message, memo_image_uri, timestamp
  ) VALUES (
    p_sender_id, 'transfer', 'debit', p_amount, p_reference, p_narration,
    p_recipient_name, p_recipient_account, 'Ovomonie', v_sender_balance - p_amount,
    p_memo_message, p_memo_image, NOW()
  );

  -- Create credit transaction
  INSERT INTO financial_transactions (
    user_id, category, type, amount, reference, narration,
    party_name, party_account, party_bank, balance_after,
    memo_message, memo_image_uri, timestamp
  ) VALUES (
    p_recipient_id, 'transfer', 'credit', p_amount, p_reference, p_narration,
    p_sender_name, p_sender_account, 'Ovomonie', v_recipient_balance + p_amount,
    p_memo_message, p_memo_image, NOW()
  );
END;
$$;
