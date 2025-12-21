# VFD Card Payment Flow - Complete Fix Verification

## What Was Fixed

### 1. Database Column Mapping
- **Issue**: Code was using `balance` column, but actual column is `wallet_balance_kobo`
- **Fixed in**:
  - `src/lib/db.ts` - mapUser function and updateBalance
  - `src/lib/virtual-accounts.ts` - getWalletBalance function
  - All VFD payment endpoints

### 2. Transaction Record Creation
- **Issue**: Balance was updating but no transaction history record was created
- **Fixed in**:
  - `src/app/api/vfd/cards/validate-otp/route.ts` - Creates transaction on success
  - `src/app/api/vfd/cards/status/route.ts` - Creates transaction on status check
  - Both timeout retry logic and normal flow

### 3. Supabase Client Usage
- **Issue**: Server-side code was using client `supabase` instead of `supabaseAdmin`
- **Fixed in**:
  - `src/lib/virtual-accounts.ts` - All functions now use supabaseAdmin

## Complete Payment Flow

```
User enters card details
    ↓
PIN verification (Ovomonie PIN)
    ↓
VFD payment initiation
    ↓
OTP validation
    ↓
[SUCCESS PATH]
    ↓
1. Update wallet_balance_kobo in users table
2. Create record in financial_transactions table
3. Return newBalanceInKobo to frontend
4. Frontend calls updateBalance(newBalanceInKobo)
5. Balance updates in UI
6. Transaction appears in history
```

## Database Schema Requirements

### users table
```sql
- id (UUID)
- wallet_balance_kobo (INTEGER) -- Balance in kobo (1 Naira = 100 kobo)
```

### financial_transactions table
```sql
- id (UUID)
- user_id (UUID)
- type ('credit' | 'debit')
- category (TEXT) -- e.g., 'wallet_funding'
- amount (INTEGER) -- Amount in kobo
- reference (TEXT) -- Unique transaction reference
- narration (TEXT) -- Description
- balance_after (INTEGER) -- Balance after transaction in kobo
- timestamp (TIMESTAMPTZ)
- status (TEXT) -- 'completed', 'pending', 'failed'
```

## Testing Steps

### 1. Check Current Balance
```bash
# In browser console on dashboard
console.log('Current balance:', localStorage.getItem('ovo-user-id'));
```

### 2. Initiate Payment
- Amount: ₦4,030 (403000 kobo)
- Card: 5060990580000217499
- Expiry: 5003 or 03/50
- CVV: 111
- Card PIN: 1111
- Authorization PIN: Your Ovomonie PIN
- OTP: 123456

### 3. Verify Balance Update
```sql
-- Check in Supabase SQL Editor
SELECT id, wallet_balance_kobo, full_name 
FROM users 
WHERE id = 'YOUR_USER_ID';
```

### 4. Verify Transaction Record
```sql
-- Check transaction was created
SELECT * 
FROM financial_transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY timestamp DESC 
LIMIT 5;
```

### 5. Verify UI Updates
- Dashboard balance should show new amount
- Transaction history should show "Card funding via VFD"
- Notification should appear

## Expected Results

### Before Payment
- Balance: 3,100,200 kobo (₦31,002)

### After Payment (₦4,030)
- Balance: 3,503,200 kobo (₦35,032)
- New transaction record with:
  - type: 'credit'
  - category: 'wallet_funding'
  - amount: 403000
  - narration: 'Card funding via VFD'
  - balance_after: 3503200
  - status: 'completed'

## Troubleshooting

### Balance Not Updating
1. Check server logs for errors
2. Verify wallet_balance_kobo column exists
3. Check user ID is correct
4. Verify supabaseAdmin is configured

### Transaction Not Appearing
1. Check financial_transactions table exists
2. Verify timestamp column is TIMESTAMPTZ
3. Check transaction query uses correct column names
4. Verify RLS policies allow user to see their transactions

### VFD API Timeout
- Payment likely succeeded despite timeout
- Balance will update after retry logic (3 attempts)
- Check logs for "VFD OTP: Balance updated successfully"

## Key Files Modified

1. `src/lib/db.ts` - Fixed balance column mapping
2. `src/lib/virtual-accounts.ts` - Fixed to use supabaseAdmin
3. `src/app/api/vfd/cards/validate-otp/route.ts` - Added transaction creation
4. `src/app/api/vfd/cards/status/route.ts` - Added transaction creation
5. `src/app/api/wallet/balance/route.ts` - Returns both formats

## Success Indicators

✅ Balance updates in database (wallet_balance_kobo)
✅ Transaction record created in financial_transactions
✅ UI balance updates immediately
✅ Transaction appears in history
✅ Notification shows correct amount
✅ No console errors
