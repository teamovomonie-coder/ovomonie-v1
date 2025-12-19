# Card Funding Balance Update Fix

## Issues Fixed

1. **Slow OTP Processing**: Improved timeout handling with better retry logic (5 retries with progressive delays)
2. **Balance Not Reflecting**: Enhanced balance update mechanism with multiple fallbacks
3. **Missing Notifications**: Added automatic notifications after successful card funding
4. **Better Error Handling**: Improved error messages and payment status checking

## Changes Made

### Backend (`src/app/api/vfd/cards/validate-otp/route.ts`)
- ✅ Increased retry attempts from 3 to 5 with better timing (2s, 4s, 6s, 8s, 10s)
- ✅ Added support for `serviceResponseCodes === 'COMPLETED'` status check
- ✅ Enhanced balance update with proper error logging
- ✅ Added `updated_at` timestamp to balance updates
- ✅ Improved amount parsing to handle nested data structures
- ✅ Added automatic notification creation after successful payment
- ✅ Better duplicate transaction handling

### Frontend (`src/components/add-money/vfd-card-payment.tsx`)
- ✅ Improved balance refresh with retry logic (up to 4 attempts)
- ✅ Better timeout handling with progressive retries
- ✅ Enhanced success callback with multiple balance fetch attempts
- ✅ Longer toast duration for payment processing messages (6 seconds)
- ✅ Automatic balance refresh at multiple intervals (4s, 6s, 8s)

## Testing Instructions

### 1. Verify Supabase Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('balance', 'updated_at', 'id', 'phone', 'account_number')
ORDER BY ordinal_position;

-- Verify balance column is bigint
SELECT 
    id, 
    phone, 
    account_number, 
    balance, 
    updated_at
FROM users
LIMIT 5;
```

Or run the migration script:
```bash
# In Supabase SQL Editor, run:
supabase-migrations/verify_balance_column.sql
```

### 2. Test Card Funding Flow

```bash
# Run the test script
node scripts/test-card-funding.js
```

This will:
- ✅ Verify users table structure
- ✅ Check balance column type
- ✅ Test balance updates
- ✅ Verify transaction logging
- ✅ Check notification creation

### 3. Manual Testing

1. **Login to the app**
2. **Go to Add Money → Card Payment**
3. **Enter amount and card details**
4. **Complete OTP verification**
5. **Verify:**
   - ✅ Balance updates immediately in dashboard
   - ✅ Notification appears in notification bell
   - ✅ Transaction appears in transaction history
   - ✅ No errors in browser console

## Expected Behavior

### Before OTP Entry
- User enters card details
- Clicks "Fund Wallet"
- Enters authorization PIN
- OTP modal appears

### After OTP Entry
- Loading state shows "Validating..."
- One of these happens:
  1. **Success**: Balance updates immediately, success toast, modal closes
  2. **Timeout**: "Payment Processing" toast, balance refreshes in background (4s, 6s, 8s)
  3. **Error**: Error message displayed, can retry

### Balance Update Timeline
- **Immediate**: First balance fetch attempt
- **+1s**: Second attempt (if first failed)
- **+2s**: Third attempt (if second failed)
- **+4s**: Background refresh (for timeout cases)
- **+6s**: Background refresh
- **+8s**: Final background refresh

## Troubleshooting

### Balance Still Not Updating?

1. **Check Supabase Connection**
   ```bash
   # Verify env variables
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Check Browser Console**
   - Open DevTools → Console
   - Look for balance fetch errors
   - Check network tab for `/api/wallet/balance` calls

3. **Check Server Logs**
   ```bash
   # Look for these log messages:
   # "VFD OTP: Balance updated successfully"
   # "VFD OTP: Transaction record created"
   ```

4. **Verify Database**
   ```sql
   -- Check if balance was actually updated
   SELECT id, balance, updated_at 
   FROM users 
   WHERE id = 'YOUR_USER_ID'
   ORDER BY updated_at DESC;
   
   -- Check if transaction was logged
   SELECT * FROM financial_transactions 
   WHERE user_id = 'YOUR_USER_ID' 
   AND category = 'deposit'
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```

### OTP Taking Too Long?

This is normal for VFD gateway. The fix includes:
- Automatic status polling
- Background balance refresh
- User-friendly "Processing" message
- Multiple retry attempts

The payment will complete even if the OTP validation times out.

## Key Improvements

1. **Resilience**: Multiple retry attempts with exponential backoff
2. **User Experience**: Clear messaging about payment processing
3. **Data Integrity**: Duplicate transaction prevention
4. **Observability**: Comprehensive logging for debugging
5. **Notifications**: Automatic user notifications for successful payments

## Files Modified

- ✅ `src/app/api/vfd/cards/validate-otp/route.ts`
- ✅ `src/components/add-money/vfd-card-payment.tsx`

## Files Created

- ✅ `supabase-migrations/verify_balance_column.sql`
- ✅ `scripts/test-card-funding.js`
- ✅ `CARD_FUNDING_FIX.md` (this file)

## Next Steps

1. Run the verification SQL script in Supabase
2. Test card funding with a small amount
3. Verify balance updates in dashboard
4. Check notifications appear
5. Monitor server logs for any errors

## Support

If issues persist:
1. Check server logs for "VFD OTP" messages
2. Verify Supabase credentials are correct
3. Ensure VFD API credentials are valid
4. Test with different card amounts
5. Check browser console for errors
