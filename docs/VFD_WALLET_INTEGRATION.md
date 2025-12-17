# VFD Wallet API Integration Status

## Overview
This document tracks the VFD Wallet API integration for Ovomonie's Add Money features.

## API Status Summary

### ✅ Working APIs

| API Endpoint | Function | Status |
|-------------|----------|--------|
| `/account/enquiry` | Get pool account details | ✅ Working |
| `/bank` | Get list of Nigerian banks | ✅ Working |
| `/credit` | Simulate inward credit (Test only) | ✅ Working |
| Bills API (all endpoints) | Bill payments | ✅ Working |

### ❌ Not Authorized (Needs VFD Dashboard Activation)

| API Endpoint | Function | Status | Action Required |
|-------------|----------|--------|-----------------|
| `/virtualaccount` | Create one-time virtual account | ❌ 99 Unauthorized | Enable from VFD Dashboard |
| `/client/create` | Create individual account with BVN | ❌ 99 Unauthorized | Enable from VFD Dashboard |
| `/client/individual` | Create individual account (consent) | ❌ 99 Unauthorized | Enable from VFD Dashboard |
| Cards API (all endpoints) | Card payments | ❌ 401 Unauthorized | Enable from VFD Dashboard |

## Environment Configuration

```env
# VFD Wallet API Configuration
VFD_ACCESS_TOKEN=eyJhbGciOiJIUzUxMiJ9...
VFD_WALLET_API_BASE=https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2
VFD_BILLS_API_BASE=https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore
```

## Pool Account Details

- **Account Number:** 1001651308
- **Account Name:** Ovomonie limited
- **Bank:** VFD Microfinance Bank
- **Balance:** ₦1,905,000 (as of last check)
- **Product:** Corporate Current Account

## Implementation Status

### Completed Features

1. **Bank Transfer Funding (Pool Account)**
   - Users can transfer to Ovomonie's VFD pool account
   - API: `/api/funding/bank-transfer`
   - Component: `BankTransfer` in `add-money-options.tsx`

2. **Webhook Handler for Credit Notifications**
   - API: `/api/webhooks/vfd-credit`
   - Handles inward credit notifications from VFD
   - Documentation: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/wallets-api/#50-inward-credit-notification

3. **Banks List API**
   - API: `/api/funding/banks`
   - Returns list of all Nigerian banks with fallback

4. **VFD Wallet Library**
   - Location: `src/lib/vfd-wallet.ts`
   - Functions: getAccountEnquiry, getBankList, getTransferRecipient, createVirtualAccount, etc.

### Pending Features (Requires VFD API Access)

1. **Virtual Account for Per-User Funding**
   - Each user gets a unique virtual account number
   - Auto-credits user wallet when transfer received
   - Requires: `/virtualaccount` API access

2. **Card Payments**
   - Fund wallet with debit/credit card
   - Requires: Cards API access

3. **User Account Creation**
   - Create VFD sub-accounts for users
   - Requires: `/client/create` API access

## Webhook Configuration

To receive inward credit notifications, you need to:

1. Share your webhook URL with VFD for both test and production environments:
   - **Your Webhook URL:** `https://ovomonie-v1.vercel.app/api/webhooks/vfd-credit`
   - Production (when ready): `https://ovomonie.com/api/webhooks/vfd-credit`

2. Webhook payload format:
```json
{
  "reference": "uniquevalue-(Randomly generated value)",
  "amount": "1000",
  "account_number": "1010123498",
  "originator_account_number": "2910292882",
  "originator_account_name": "SENDER NAME",
  "originator_bank": "000004",
  "originator_narration": "payment",
  "timestamp": "2021-01-11T09:34:55.879Z",
  "transaction_channel": "EFT",
  "session_id": "00001111222233334455"
}
```

3. Your webhook must:
   - Respond with HTTP 200 status
   - Handle security via Authentication or IP whitelisting

## Files Created/Modified

### New Files
- `src/lib/vfd-wallet.ts` - VFD Wallet API client library
- `src/app/api/funding/bank-transfer/route.ts` - Bank transfer API
- `src/app/api/funding/banks/route.ts` - Banks list API
- `src/app/api/webhooks/vfd-credit/route.ts` - Webhook handler
- `scripts/test-wallet-api.js` - API test script

### Modified Files
- `.env.local` - Added VFD_WALLET_API_BASE
- `src/lib/vfd.ts` - Simplified headers per VFD docs
- `src/lib/vfd-bills.ts` - Simplified headers per VFD docs
- `src/components/add-money/add-money-options.tsx` - Updated BankTransfer component

## Next Steps

1. **Enable Virtual Account API** - Contact VFD or use dashboard to enable `/virtualaccount` endpoint
2. **Enable Cards API** - Contact VFD or use dashboard to enable cards API
3. **Configure Webhook** - Share webhook URL with VFD for credit notifications
4. **Test Inward Transfers** - Use `/credit` endpoint in test environment to simulate
5. **Implement User Matching** - Match incoming transfers to users by reference/amount

## Testing

Run the wallet API test:
```bash
node scripts/test-wallet-api.js
```

Test credit simulation:
```bash
node -e "
const token = process.env.VFD_ACCESS_TOKEN;
fetch('https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2/credit', {
  method: 'POST',
  headers: { 'AccessToken': token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: '5000',
    accountNo: '1001651308',
    senderAccountNo: '5050104070',
    senderBank: '000002',
    senderNarration: 'Test credit'
  })
}).then(r => r.json()).then(console.log);
"
```

## Contact

For VFD API issues or to enable additional features:
- VFD Support: Contact through dashboard or support email
- Documentation: https://vbaas-docs.vfdtech.ng/

---
Last Updated: ${new Date().toISOString()}
