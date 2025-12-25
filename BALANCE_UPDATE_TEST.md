# Balance Update Test Guide

## Quick Test: Verify Balance Updates

### Step 1: Check Current Balance in Supabase

```sql
-- Run in Supabase SQL Editor
SELECT id, phone, balance, updated_at 
FROM users 
WHERE phone = 'YOUR_PHONE_NUMBER';
```

Note the current balance in kobo.

### Step 2: Test Manual Balance Update

```bash
# Get your auth token from browser localStorage: ovo-auth-token
# Then run:

curl -X POST http://localhost:3000/api/debug/test-update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'

# This adds ₦1,000 (100000 kobo) to your balance
```

Expected response:
```json
{
  "ok": true,
  "previousBalance": 0,
  "newBalance": 100000,
  "amountAdded": 100000
}
```

### Step 3: Check Balance in Dashboard

1. Open dashboard in browser
2. Check if balance shows ₦1,000.00
3. Open browser console (F12)
4. Look for console logs: "Balance refreshed: 100000"

### Step 4: Force Balance Refresh

In browser console, run:
```javascript
// Get current balance from API
fetch('/api/wallet/balance', {
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('ovo-auth-token')
  }
})
.then(r => r.json())
.then(d => console.log('Balance:', d.balanceInKobo / 100, 'Naira'));
```

### Step 5: Test Card Funding

1. Go to Add Money → Card Payment
2. Enter amount: ₦1,000
3. Enter card details
4. Complete OTP
5. **Watch browser console** for these logs:
   - "Balance refreshed: XXXXX"
   - "Success callback - balance: XXXXX"
   - "Updating balance from response: XXXXX"

### Step 6: Verify Balance Updated

Check these places:
1. ✅ Dashboard shows new balance
2. ✅ Browser console shows balance logs
3. ✅ Supabase shows updated balance
4. ✅ Transaction appears in history

## Debugging Balance Issues

### Issue: Balance not updating in UI

**Check 1: Is balance updated in Supabase?**
```sql
SELECT balance, updated_at FROM users WHERE id = 'YOUR_USER_ID';
```

If YES → Frontend issue
If NO → Backend issue

**Check 2: Is updateBalance being called?**
Open browser console, look for:
```
Balance refreshed: XXXXX
Success callback - balance: XXXXX
```

If YES → Auth context issue
If NO → API call issue

**Check 3: Is API returning correct balance?**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/wallet/balance
```

Should return:
```json
{
  "ok": true,
  "balanceInKobo": 100000
}
```

**Check 4: Is auth context updating?**
In browser console:
```javascript
// Check current balance in context
console.log('Context balance:', window.localStorage.getItem('ovo-auth-token'));
```

### Issue: Balance shows 0 after payment

**Solution 1: Force refresh**
```javascript
// In browser console
window.location.reload();
```

**Solution 2: Manual balance sync**
```bash
curl -X POST http://localhost:3000/api/wallet/sync-balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Solution 3: Check transaction was created**
```sql
SELECT * FROM financial_transactions 
WHERE user_id = 'YOUR_USER_ID' 
AND category = 'deposit'
ORDER BY timestamp DESC 
LIMIT 5;
```

## Common Issues & Fixes

### 1. Balance updates in Supabase but not in UI

**Cause**: Frontend not refreshing
**Fix**: Added multiple refresh attempts (2s, 5s, 8s)

### 2. Balance shows old value

**Cause**: Cached response
**Fix**: Added `cache: 'no-store'` to fetch calls

### 3. Balance resets after page reload

**Cause**: Auth context not fetching latest
**Fix**: fetchUserData() called on mount

### 4. Balance shows 0 after successful payment

**Cause**: updateBalance not called
**Fix**: Added console logs to track calls

## Test Checklist

- [ ] Manual balance update works (test-update endpoint)
- [ ] Balance shows in dashboard after manual update
- [ ] Balance API returns correct value
- [ ] Card funding completes successfully
- [ ] Balance updates in Supabase after card funding
- [ ] Balance updates in UI after card funding
- [ ] Console logs show balance refresh calls
- [ ] Transaction appears in history
- [ ] Notification appears

## Expected Console Logs

After successful card funding, you should see:
```
Updating balance from response: 100000
Balance refreshed: 100000
Success callback - balance: 100000
Balance refreshed: 100000  (after 2s)
Balance refreshed: 100000  (after 5s)
```

If you don't see these logs, the updateBalance function is not being called.

## Quick Fix Commands

```bash
# 1. Check current balance
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/wallet/balance

# 2. Add test amount
curl -X POST http://localhost:3000/api/debug/test-update \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'

# 3. Check debug info
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/debug/balance

# 4. Force sync
curl -X POST http://localhost:3000/api/wallet/sync-balance \
  -H "Authorization: Bearer TOKEN"
```

## Success Criteria

✅ Manual balance update reflects in UI immediately
✅ Card funding updates balance in Supabase
✅ Card funding updates balance in UI within 10 seconds
✅ Console logs show balance refresh calls
✅ No errors in browser console
✅ No 500 errors in server logs

If all criteria pass, balance updates are working correctly!
