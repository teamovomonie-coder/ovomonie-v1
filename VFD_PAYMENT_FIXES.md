# VFD Card Payment Integration - Fixes Applied

## Issues Identified

1. **Balance API Response Format Mismatch**
   - Frontend expected `balanceInKobo` field
   - API was returning only `data.balance`

2. **Database Column Name Error**
   - Code was querying `balance` column
   - Actual column name is `wallet_balance_kobo`

3. **Missing Database Check**
   - validate-otp endpoint didn't check if supabase client exists
   - Caused "User not found" errors

4. **Missing saved_cards Table**
   - Table doesn't exist in database
   - Caused 500 errors when fetching saved cards

## Fixes Applied

### 1. Balance API Response (`src/app/api/wallet/balance/route.ts`)
```typescript
// Now returns both formats for compatibility
return NextResponse.json({
  ok: true,
  success: true,
  balanceInKobo: balance.balance,  // ← Added this
  data: balance
});
```

### 2. Wallet Balance Query (`src/lib/virtual-accounts.ts`)
```typescript
// Changed from 'balance' to 'wallet_balance_kobo'
const { data, error } = await supabase
  .from('users')
  .select('wallet_balance_kobo')  // ← Fixed column name
  .eq('id', userId)
  .single();
```

### 3. Database Check (`src/app/api/vfd/cards/validate-otp/route.ts`)
```typescript
// Added check at start of function
if (!supabase) {
  return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
}
```

### 4. Saved Cards Table
- Created migration file: `supabase/migrations/20250101000000_create_saved_cards.sql`
- Updated API to handle missing table gracefully (returns empty array)

## How to Apply Fixes

### Step 1: Run Database Migration
```bash
# Option A: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/agzdjkhifsqsiowllnqa
2. Navigate to SQL Editor
3. Copy contents of supabase/migrations/20250101000000_create_saved_cards.sql
4. Execute the SQL

# Option B: Using Supabase CLI
supabase link --project-ref agzdjkhifsqsiowllnqa
supabase db push
```

### Step 2: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test Payment Flow
1. Navigate to Add Money page
2. Enter card details:
   - Card: 5060990580000217499
   - Expiry: 5003 (or 03/50)
   - CVV: 111
   - PIN: 1111
3. Enter authorization PIN
4. Enter OTP: 123456
5. Verify balance updates correctly

## Expected Behavior After Fixes

1. **Balance Updates Immediately**
   - After successful payment, balance refreshes from database
   - Shows updated amount in wallet

2. **Timeout Handling**
   - If VFD API times out, balance still updates
   - User sees "Payment Processing" message
   - Balance refreshes automatically after 3 seconds

3. **Saved Cards**
   - No more 500 errors when loading saved cards
   - Returns empty array if table doesn't exist
   - After migration, cards can be saved and reused

4. **Error Messages**
   - Clear error messages for all failure scenarios
   - No more "User not found" errors
   - Proper handling of network timeouts

## Testing Checklist

- [ ] Balance API returns correct format
- [ ] Payment completes successfully
- [ ] Balance updates in UI immediately
- [ ] Timeout scenario handled gracefully
- [ ] Saved cards load without errors
- [ ] Card can be saved for future use
- [ ] Notifications created correctly
- [ ] Transaction history shows payment

## Notes

- VFD test environment is unstable (frequent 504 timeouts)
- Payment often succeeds despite API timeout
- Balance is updated in database even when VFD times out
- UI now handles this by refreshing balance from database
