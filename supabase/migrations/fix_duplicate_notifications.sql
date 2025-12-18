-- Remove duplicate notification creation from perform_internal_transfer function
-- This function was creating notifications for both sender and recipient
-- We only want notification for the sender

CREATE OR REPLACE FUNCTION perform_internal_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount BIGINT,
  p_reference VARCHAR,
  p_narration TEXT
) RETURNS VOID AS $$
DECLARE
  v_sender_balance BIGINT;
  v_recipient_balance BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Fetch balances
  SELECT balance INTO v_sender_balance FROM users WHERE id = p_sender_id FOR UPDATE;
  SELECT balance INTO v_recipient_balance FROM users WHERE id = p_recipient_id FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender not found';
  END IF;
  IF v_recipient_balance IS NULL THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Debit sender
  UPDATE users SET balance = balance - p_amount WHERE id = p_sender_id;
  -- Credit recipient
  UPDATE users SET balance = balance + p_amount WHERE id = p_recipient_id;

  -- Log transactions
  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  VALUES (p_sender_id, 'transfer', 'debit', p_amount, p_reference, p_narration, jsonb_build_object('to', p_recipient_id), (v_sender_balance - p_amount));

  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  VALUES (p_recipient_id, 'transfer', 'credit', p_amount, p_reference, p_narration, jsonb_build_object('from', p_sender_id), (v_recipient_balance + p_amount));

  -- DO NOT create notifications here - they are created by the API route
END;
$$ LANGUAGE plpgsql;
