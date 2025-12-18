-- Atomic transfer function with notifications
CREATE OR REPLACE FUNCTION perform_transfer(
  p_sender_id TEXT,
  p_recipient_id TEXT,
  p_amount BIGINT,
  p_reference TEXT,
  p_narration TEXT,
  p_sender_name TEXT,
  p_sender_phone TEXT,
  p_sender_account TEXT,
  p_recipient_name TEXT,
  p_recipient_phone TEXT,
  p_recipient_account TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update sender balance
  UPDATE users SET balance = balance - p_amount WHERE id = p_sender_id;
  
  -- Update recipient balance
  UPDATE users SET balance = balance + p_amount WHERE id = p_recipient_id;
  
  -- Insert debit transaction
  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  SELECT p_sender_id, 'transfer', 'debit', p_amount, p_reference, p_narration,
         jsonb_build_object('name', p_recipient_name, 'account', p_recipient_account, 'bank', 'Ovomonie'),
         balance FROM users WHERE id = p_sender_id;
  
  -- Insert credit transaction
  INSERT INTO financial_transactions (user_id, category, type, amount, reference, narration, party, balance_after)
  SELECT p_recipient_id, 'transfer', 'credit', p_amount, p_reference, p_narration,
         jsonb_build_object('name', p_sender_name, 'account', p_sender_account, 'bank', 'Ovomonie'),
         balance FROM users WHERE id = p_recipient_id;
  
  -- Create notifications
  INSERT INTO notifications (user_id, title, body, category, type, amount, reference, sender_name, sender_phone, sender_account, recipient_name, recipient_phone, recipient_account)
  VALUES 
    (p_sender_id, 'Money Sent', '₦' || (p_amount / 100.0)::text || ' sent to ' || p_recipient_name, 'transfer', 'debit', p_amount, p_reference, p_sender_name, p_sender_phone, p_sender_account, p_recipient_name, p_recipient_phone, p_recipient_account),
    (p_recipient_id, 'Money Received', '₦' || (p_amount / 100.0)::text || ' received from ' || p_sender_name, 'transfer', 'credit', p_amount, p_reference, p_sender_name, p_sender_phone, p_sender_account, p_recipient_name, p_recipient_phone, p_recipient_account);
END;
$$ LANGUAGE plpgsql;
