-- Delete duplicate "Transfer Successful" notifications
-- Keep only the most recent one for each user and reference combination

DELETE FROM notifications
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, reference ORDER BY created_at DESC) as rn
    FROM notifications
    WHERE title = 'Transfer Successful'
      AND reference IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- Also delete old "Transfer Sent" notifications (replaced by "Transfer Successful")
DELETE FROM notifications
WHERE title = 'Transfer Sent';
