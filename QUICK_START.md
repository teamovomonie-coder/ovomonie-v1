# Quick Start: Notification & PIN System

## What Was Changed

### 1. Real-time Notifications (Supabase)
- **File:** `src/context/notification-context.tsx`
- **Change:** Migrated from Firebase to Supabase real-time updates
- **Result:** Notifications now appear instantly using WebSocket

### 2. PIN Authorization
- **New File:** `src/lib/pin-validator.ts`
- **Updated APIs:**
  - `POST /api/transfers/internal` - Requires transaction PIN
  - `POST /api/funding/deposit` - Requires login PIN
  - `POST /api/funding/withdraw` - Requires both PINs
- **Result:** All transactions now validate PIN before processing

### 3. Recipient Verification
- **Enhancement:** Transfer API returns recipient name
- **Result:** Users can confirm "Send ₦X to [Name]?" before confirming

---

## How It Works

### Transfer Example

```
User enters:
- Recipient account: OVO123456789
- Amount: ₦50,000
- Transaction PIN: 5678

API does:
1. ✓ Validate PIN against stored hash
2. ✓ Get recipient info from database
3. ✓ Process via VFD (primary gateway)
4. ✓ Backup transaction to Supabase
5. ✓ Create notifications for both users
6. ✓ Broadcast update via WebSocket

User sees:
- "Transfer Sent: ₦50,000 to John Doe"
- Recipient sees: "Transfer Received: ₦50,000 from Jane Smith"
- Updates appear immediately (no refresh needed)
```

---

## Testing Checklist

### Before Testing
- [ ] Run `npm install` (all packages installed)
- [ ] Verify `.env.local` has Supabase keys
- [ ] Execute migrations: `docs/supabase-migrations.sql`

### Test Transfer
```bash
# 1. Register user
POST http://localhost:3000/api/auth/register
{
  "phone": "2348012345678",
  "pin": "1234",           # login PIN
  "transactionPin": "5678" # transaction PIN
}

# 2. Login
POST http://localhost:3000/api/auth/login
{
  "phone": "2348012345678",
  "pin": "1234"  # use login PIN (not transaction PIN)
}
# Get token and userId from response

# 3. Transfer to another user
POST http://localhost:3000/api/transfers/internal
Header: Authorization: Bearer {token}
{
  "recipientAccountNumber": "OVO987654321",
  "amount": 50000,
  "clientReference": "TXN-123",
  "senderPin": "5678"  # use transaction PIN
}

# Response should include:
{
  "recipientName": "John Doe",
  "amount": 50000,
  "reference": "TXN-123",
  "timestamp": "..."
}
```

### Test Deposit
```bash
POST http://localhost:3000/api/funding/deposit
Header: Authorization: Bearer {token}
{
  "amount": 100000,
  "reference": "DEP-123",
  "paymentMethod": "card",
  "userPin": "1234"  # use login PIN
}
```

### Test Withdrawal
```bash
POST http://localhost:3000/api/funding/withdraw
Header: Authorization: Bearer {token}
{
  "amount": 50000,
  "reference": "WTH-456",
  "userPin": "1234",           # login PIN
  "transactionPin": "5678",    # transaction PIN
  "bankAccountNumber": "0123456789"
}
```

### Test Wrong PIN
```bash
# Try transfer with wrong PIN
POST http://localhost:3000/api/transfers/internal
Header: Authorization: Bearer {token}
{
  "recipientAccountNumber": "OVO987654321",
  "amount": 50000,
  "clientReference": "TXN-456",
  "senderPin": "0000"  # wrong PIN
}

# Response: 401 Unauthorized
{
  "message": "Invalid transaction PIN. Please try again."
}
```

---

## Key Points

### PIN Rules
| Operation | Login PIN | Transaction PIN |
|-----------|-----------|-----------------|
| Register | ✓ Set | ✓ Set |
| Login | ✓ Use | ✗ Ignored |
| Transfer | ✗ Ignored | ✓ Use |
| Deposit | ✓ Use | ✗ Ignored |
| Withdraw | ✓ Use | ✓ Use |

### Notifications
- Create automatically on transactions
- Appear instantly (no page refresh)
- Can be marked as read
- Stored with transaction reference for tracking

### Security
- PINs validated server-side only
- PINs never logged or exposed
- All transactions have audit trail
- Failed attempts are logged

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run TypeScript check
npm run typecheck

# Format code
npm run format

# Run linter
npm run lint
```

---

## Files Changed Summary

| File | Status | Change |
|------|--------|--------|
| `src/context/notification-context.tsx` | Updated | Supabase real-time |
| `src/lib/pin-validator.ts` | Created | PIN validation utils |
| `src/app/api/transfers/internal/route.ts` | Updated | Add PIN validation |
| `src/app/api/funding/deposit/route.ts` | Updated | Add PIN validation |
| `src/app/api/funding/withdraw/route.ts` | Updated | Add dual PIN validation |
| `docs/NOTIFICATION_AND_PIN_SYSTEM.md` | Created | Full documentation |
| `docs/SYSTEM_ARCHITECTURE.md` | Created | Architecture diagrams |
| `IMPLEMENTATION_CHECKLIST.md` | Created | Verification checklist |

---

## Database Requirement

Before testing, execute migrations in Supabase:

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Copy entire contents of `docs/supabase-migrations.sql`
4. Click RUN

This creates:
- `users` table (with PIN hash columns)
- `notifications` table
- `financial_transactions` table

---

## Expected Behavior

### User Registration
1. User enters phone, login PIN, transaction PIN
2. All PINs are hashed with bcrypt
3. User gets account number and balance
4. Can immediately login

### User Login
1. User enters phone and login PIN only
2. System validates PIN against stored hash
3. Returns JWT token and user data
4. User is authenticated

### P2P Transfer
1. User enters recipient account, amount, transaction PIN
2. System validates transaction PIN
3. System looks up recipient name for verification
4. VFD processes payment
5. Supabase updated with new balances
6. Notifications created and broadcast in real-time
7. Both users see update instantly

### Real-time Notifications
1. Transaction completed → Notification inserted in Supabase
2. postgres_changes event triggered
3. WebSocket broadcast to all users subscribed
4. Frontend receives update → State updated → UI renders new notification
5. All happens within milliseconds

---

## Troubleshooting

### "Invalid transaction PIN" for correct PIN
- **Cause:** PIN hash in database incorrect
- **Fix:** Ensure PIN was hashed with `hashSecret()` during registration
- **Verify:** Check bcrypt hash format in users.transaction_pin_hash

### Notifications not appearing
- **Cause:** WebSocket not connected
- **Fix:** Check browser console for connection errors
- **Verify:** Ensure user.userId is set in auth context

### "Recipient account not found"
- **Cause:** Recipient doesn't exist in database
- **Fix:** Verify recipient was registered with correct account number
- **Check:** Query Supabase: `SELECT account_number FROM users`

### "Insufficient balance"
- **Cause:** User balance in kobo less than amount in kobo
- **Note:** Balance stored in kobo (₦0.01 units)
- **Example:** ₦100 stored as 10000 in database

---

## Next Steps

1. ✅ Execute Supabase migrations
2. ✅ Test registration with both PINs
3. ✅ Test login with login PIN
4. ✅ Test transfer with transaction PIN
5. ✅ Test withdrawal with both PINs
6. ✅ Test wrong PIN (verify 401 response)
7. ✅ Verify notifications appear in real-time
8. ✅ Test marking notification as read
9. ✅ Deploy to production

---

## Support

For issues or questions:
1. Check `docs/NOTIFICATION_AND_PIN_SYSTEM.md` for detailed docs
2. Check `docs/SYSTEM_ARCHITECTURE.md` for architecture diagrams
3. Check `IMPLEMENTATION_CHECKLIST.md` for troubleshooting
4. Review error logs for specific error messages

---

**Version:** 1.0
**Status:** ✅ Ready for Testing
**Date:** January 15, 2024

