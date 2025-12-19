# Fix Balance Update - IMMEDIATE ACTION

## Problem
Balance is NOT being updated in Supabase after card funding. The OTP validation succeeds but balance remains the same.

## Root Cause
The `validate-otp` endpoint is not finding the payment amount from VFD's response, so it's not updating the balance.

## IMMEDIATE FIX

### Step 1: Create pending_payments Table

Run this in Supabase SQL Editor NOW:

```sql
CREATE TABLE IF NOT EXISTS pending_payments (
  reference TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_reference ON pending_payments(reference);
```

### Step 2: Test Balance Update Manually

In browser console, run:

```javascript
// Replace with your actual values
const token = localStorage.getItem('ovo-auth-token');
const amount = 30; // Amount in Naira (will be converted to kobo)

fetch('/api/vfd/cards/force-update', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    amount: amount,
    reference: 'TEST-' + Date.now()
  })
})
.then(r => r.json())
.then(d => {
  console.log('Balance update result:', d);
  // Refresh page to see new balance
  setTimeout(() => window.location.reload(), 1000);
});
```

### Step 3: Verify Balance Updated

Check Supabase:
```sql
SELECT id, balance, updated_at 
FROM users 
WHERE id = '2e8c6054-12f5-49df-aa73-4fcf032cf3a2';
```

## Why This Fixes It

1. **pending_payments table**: Stores payment amount when initiating
2. **force-update endpoint**: Directly updates balance without relying on VFD response
3. **validate-otp fallback**: Now checks pending_payments if VFD doesn't return amount

## Test Card Funding Again

1. Create pending_payments table (Step 1 above)
2. Fund wallet with card
3. Enter OTP
4. Balance should update within 5 seconds

## If Balance Still Doesn't Update

Run this in browser console after OTP:

```javascript
const token = localStorage.getItem('ovo-auth-token');

// Get the reference from the last payment (check network tab)
const reference = 'YOUR_PAYMENT_REFERENCE';
const amount = 30; // Amount you tried to add

fetch('/api/vfd/cards/force-update', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount, reference })
})
.then(r => r.json())
.then(d => console.log(d));
```

Then refresh the page.

## Check Server Logs

Look for these messages:
- "VFD OTP: Balance updated from pending_payments"
- "Balance updated successfully"
- "VFD OTP: Updating balance and creating transaction"

If you see "No amount in payment details", that's the problem - VFD isn't returning the amount.

## Quick Debug

```bash
# Check if pending_payments table exists
curl -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  "https://agzdjkhifsqsiowllnqa.supabase.co/rest/v1/pending_payments?select=*&limit=5"

# Check current balance
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/wallet/balance

# Force update balance
curl -X POST http://localhost:3000/api/vfd/cards/force-update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 30, "reference": "TEST-123"}'
```

## Success Criteria

✅ pending_payments table created
✅ Balance updates in Supabase after card funding
✅ Balance shows in dashboard
✅ Transaction appears in history
✅ Notification appears

## Next Payment

After creating pending_payments table, the next card funding should work automatically because:
1. Initiate endpoint stores amount in pending_payments
2. Validate-OTP retrieves amount from pending_payments
3. Balance gets updated correctly

---

**CRITICAL**: Create the pending_payments table NOW before testing again!
