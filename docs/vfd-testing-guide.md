# VFD Payment Integration Testing Guide

## Overview
This guide walks you through testing the newly integrated VFD payment flows for card funding, bill payments, airtime, and betting deposits.

## Prerequisites
1. ✅ VFD credentials configured in `.env.local`:
   - `VFD_CONSUMER_KEY`
   - `VFD_CONSUMER_SECRET`
   - `VFD_TOKEN_URL`
   - `VFD_API_BASE`

2. Dev server running: `npm run dev`
3. App available at `http://localhost:3000`

## Test Card Numbers
Use these cards for testing (test environment only):

| Network | Card Number | PIN | CVV | Expiry |
|---------|-------------|-----|-----|--------|
| Visa | 4532123456789010 | 1234 | 123 | 12/25 |
| Mastercard | 5425233010103010 | 1234 | 123 | 12/25 |

## Testing Card Payment (VFD Card)

### Location
Go to: **Add Money → Card Payment**

### Steps
1. **Enter Amount**: Enter `1000` (₦1000)
2. **Card Details**:
   - Card Number: `4532123456789010`
   - Expiry: `12/25`
   - CVV: `123`
3. **Click**: "Fund Wallet"
4. **PIN Confirmation**: Enter your 4-digit PIN when prompted
5. **Expected Outcomes**:
   - ✅ Payment initiated
   - ✅ OTP prompt appears (check server logs for test OTP if VFD requires it)
   - ✅ Success notification shows "Wallet Funded"
   - ✅ Transaction logged in Firestore

### Troubleshooting Card Payment
- **"Unauthorized" error**: Check VFD credentials in `.env.local`
- **"Internal Server Error"**: Check server logs for VFD API response
- **OTP not received**: VFD may print OTP in server logs in test mode

---

## Testing Bill Payment (VFD Bill)

### Location
Go to: **Bill Payment**

### Steps
1. **Select Provider**: Choose any provider (e.g., "Ikeja Electric")
2. **Account Number**: Enter `1100110011` (test account)
3. **Account Name**: Enter `Test User` (optional)
4. **Amount**: Enter `5000` (₦5000)
5. **Click**: "Pay Bill"
6. **PIN Confirmation**: Enter your 4-digit PIN
7. **Expected Outcomes**:
   - ✅ Payment processed via VFD
   - ✅ Success notification shows "Bill Paid"
   - ✅ Amount deducted from wallet
   - ✅ Transaction logged

### Test Providers
- **Electricity**: IKEDC, EKEDC, AEDC
- **Cable**: DStv, GOtv, StarTimes
- **Internet**: Spectranet, Smile
- **Water**: Lagos Water Corp

---

## Testing Airtime Payment (VFD Airtime)

### Location
Go to: **Airtime**

### Steps
1. **Select Network**: Choose MTN, Airtel, GLO, or 9Mobile
2. **Phone Number**: Enter `08012345678` (test number)
3. **Amount**: Click a quick amount (e.g., ₦1000) or enter custom
4. **Click**: "Buy Airtime"
5. **PIN Confirmation**: Enter your 4-digit PIN
6. **Expected Outcomes**:
   - ✅ Airtime purchase processed
   - ✅ Success notification shows "Airtime Purchased"
   - ✅ Amount deducted from wallet
   - ✅ Transaction logged to Firestore

### Quick Amounts Available
- ₦100, ₦500, ₦1000, ₦2000, ₦5000, ₦10000

---

## Testing Betting Payment (VFD Betting)

### Location
Go to: **Betting**

### Steps
1. **Select Platform**: Choose Bet9ja, BetKing, Nairabet, SportyBet, BetLion, or Betway
2. **Account ID** (Optional): Enter your betting username if available
3. **Amount**: Click a quick amount (e.g., ₦5000) or enter custom
4. **Click**: "Deposit to Betting"
5. **PIN Confirmation**: Enter your 4-digit PIN
6. **Expected Outcomes**:
   - ✅ Betting deposit processed
   - ✅ Success notification shows "Betting Account Funded"
   - ✅ Amount deducted from wallet
   - ✅ Transaction logged with betting platform info

### Available Platforms
- Bet9ja
- BetKing
- Nairabet
- SportyBet
- BetLion
- Betway

### Important Notes
⚠️ Responsible gambling warning is displayed before confirmation

---

## Testing Flow Summary

### Complete End-to-End Test Path
```
1. Start: http://localhost:3000
2. Login with test account
3. Go to Add Money → Card Payment
   └─ Test card funding → Success ✅
4. Go to Bill Payment
   └─ Test bill payment → Success ✅
5. Go to Airtime
   └─ Test airtime purchase → Success ✅
6. Go to Betting
   └─ Test betting deposit → Success ✅
7. Check Profile → Transactions
   └─ All transactions should appear ✅
```

---

## Verification Checklist

After each payment type test, verify:

### UI Verification
- [ ] Form accepts input without validation errors
- [ ] PIN modal appears on submit
- [ ] Success toast notification displays
- [ ] Dialog closes after completion
- [ ] Form resets for next payment

### Backend Verification
Check server logs (Terminal running `npm run dev`):
- [ ] Log shows "[VFD Payment] User {userId} action: initiate"
- [ ] Payment reference is unique
- [ ] Idempotency check passes
- [ ] VFD response logged

### Firestore Verification
Check Firestore Console:
1. Navigate to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database → financialTransactions**
4. Verify records contain:
   - ✅ `userId` (your user ID)
   - ✅ `reference` (unique reference)
   - ✅ `category` (card_funding, bill_payment, airtime, betting)
   - ✅ `amount` (in kobo)
   - ✅ `status` (completed/pending)
   - ✅ `paymentGateway` (VFD)
   - ✅ `createdAt` timestamp

### Profile/Wallet Verification
1. Go to **Profile → Personal Information**
2. Check **Recent Transactions** shows:
   - ✅ All payments appear
   - ✅ Correct amounts
   - ✅ Correct dates/times
   - ✅ Correct categories

---

## Common Test Scenarios

### Scenario 1: Successful Card Payment
```
Amount: ₦1000
Card: 4532123456789010
PIN: 1234
OTP: Check server logs
Expected: Payment completed, wallet updated
```

### Scenario 2: Bill Payment with Utility
```
Provider: Ikeja Electric
Account: 1100110011
Amount: ₦2000
PIN: 1234
Expected: Bill payment processed, confirmation sent
```

### Scenario 3: Multiple Airtime Purchases
```
Network: MTN
Phone: 08012345678
Amount: ₦1000
---
Network: Airtel
Phone: 08087654321
Amount: ₦2000
Expected: Multiple transactions logged separately
```

### Scenario 4: Betting Deposit
```
Platform: Bet9ja
Amount: ₦10000
PIN: 1234
Expected: Betting account funded, transaction recorded
```

---

## Error Scenarios to Test

### 1. Insufficient Funds
- Create payment > wallet balance
- Expected: Error toast "Insufficient funds"

### 2. Idempotent Request
- Use same reference twice
- Expected: "Already processed" response

### 3. Invalid Token
- Clear localStorage `ovo-auth-token`
- Try payment
- Expected: 401 Unauthorized error

### 4. VFD Credential Error
- Intentionally set wrong VFD_CONSUMER_KEY
- Try card payment
- Expected: Specific error message from VFD

### 5. Network Timeout
- Disable internet during payment
- Expected: Graceful error handling

---

## Debug Tips

### Enable Detailed Logging
Server logs show:
```
[VFD Payment] User {id} action: initiate
[VFD] Initiating card_funding payment: {amount, reference}
[VFD] Transaction logged for reference {ref}
```

### Check VFD Response
Server logs include VFD API responses. Look for:
```
{
  "status": "success|pending|failed",
  "reference": "VFD_ABC123",
  "requiresOTP": true|false,
  "data": { ... }
}
```

### Browser Console (F12)
- Check Network tab for API calls
- Verify Authorization header contains token
- Check response JSON structure

---

## Success Criteria

All tests pass when:

1. ✅ Card payment initiates and can be OTP validated
2. ✅ Bill payment processes and updates wallet
3. ✅ Airtime purchase works with quick amount selection
4. ✅ Betting deposit includes responsible gambling warning
5. ✅ All transactions appear in Firestore
6. ✅ All transactions show in Profile
7. ✅ Wallet balance updates correctly
8. ✅ Error messages are clear and helpful
9. ✅ OTP flow works (if required by VFD)
10. ✅ Idempotency prevents duplicate charges

---

## Next Steps After Testing

1. **Staging/Production**:
   - Update environment variables with production VFD credentials
   - Test with real card numbers (Paystack integration provides test cards)
   - Verify Firestore security rules

2. **Monitoring**:
   - Set up error tracking (Sentry, Datadog)
   - Monitor VFD API response times
   - Log payment success rates

3. **User Communication**:
   - Add transaction receipts/confirmations
   - Implement email/SMS notifications
   - Create payment history export

4. **Feature Enhancements**:
   - Recurring payments
   - Scheduled payments
   - Payment templates
   - Multi-currency support

---

## Support

If you encounter issues:
1. Check server logs for error details
2. Verify VFD credentials in `.env.local`
3. Check Firestore security rules aren't blocking writes
4. Review [VFD Integration Docs](./vfd-integration.md)
5. Check API response in Network tab (F12)
