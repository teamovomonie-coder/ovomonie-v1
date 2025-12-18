-- Update perform_internal_transfer to create notification with complete details
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
  v_sender_name VARCHAR;
  v_sender_phone VARCHAR;
  v_sender_account VARCHAR;
  v_recipient_name VARCHAR;
  v_recipient_phone VARCHAR;
  v_recipient_account VARCHAR;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Fetch sender details
  SELECT balance, full_name, phone, account_number 
  INTO v_sender_balance, v_sender_name, v_sender_phone, v_sender_account
  FROM users WHERE id = p_sender_id FOR UPDATE;

  -- Fetch recipient details
  SELECT balance, full_name, phone, account_number 
  INTO v_recipient_balance, v_recipient_name, v_recipient_phone, v_recipient_account
  FROM users WHERE id = p_recipient_id FOR UPDATE;

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
  VALUES (p_sender_id, 'transfer', 'debit', p_amount, p_reference, p_narration, jsonb_build_object('to', v_recipient_phone, 'name', v_recipient_name), (v_sender_balance - p_amount));

  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  VALUES (p_recipient_id, 'transfer', 'credit', p_amount, p_reference, p_narration, jsonb_build_object('from', v_sender_phone, 'name', v_sender_name), (v_recipient_balance + p_amount));

  -- Create notification for sender with complete details
  INSERT INTO notifications (user_id, title, body, category, type, amount, reference, sender_name, recipient_name)
  VALUES (
    p_sender_id, 
    'Transfer Successful', 
    'You sent ₦' || (p_amount / 100.0)::text || ' to ' || v_recipient_name || '.', 
    'transfer', 
    'debit', 
    p_amount, 
    p_reference,
    v_sender_name,
    v_recipient_name
  );
END;
$$ LANGUAGE plpgsql;
