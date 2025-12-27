# VFD Card Payment Setup Guide

## Overview
This guide will help you set up VFD card payment integration for the OVOMONIE app.

## Prerequisites
1. VFD Bank BaaS account
2. VFD Consumer Key and Consumer Secret
3. Access to VFD API documentation

## Environment Variables

Add the following to your `.env.local` file:

```env
# VFD API Configuration
VFD_API_BASE=https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards
VFD_CONSUMER_KEY=your-vfd-consumer-key
VFD_CONSUMER_SECRET=your-vfd-consumer-secret
VFD_TOKEN_URL=https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token

# Optional: Pre-generated access token (if available)
VFD_ACCESS_TOKEN=your-vfd-access-token
```

### For Production
Change the base URLs to production endpoints:
```env
VFD_API_BASE=https://api-apps.vfdbank.systems/vtech-cards/api/v2/baas-cards
VFD_TOKEN_URL=https://api-apps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token
```

## How It Works

### 1. Card Payment Flow
```
User enters card details → API initiates payment → VFD processes → OTP sent (if required) → User validates OTP → Payment completed
```

### 2. API Endpoints

#### Initiate Card Payment
- **Endpoint**: `POST /api/funding/card`
- **Request Body**:
```json
{
  "amount": 5000,
  "reference": "card_1234567890_abc123",
  "cardNumber": "5061020000000000094",
  "cardPin": "1234",
  "cvv2": "123",
  "expiryDate": "2512",
  "shouldTokenize": false
}
```

- **Response** (Success - No OTP):
```json
{
  "message": "Payment completed successfully",
  "newBalanceInKobo": 500000,
  "requiresOTP": false,
  "reference": "card_1234567890_abc123"
}
```

- **Response** (OTP Required):
```json
{
  "message": "OTP required for authorization",
  "requiresOTP": true,
  "reference": "card_1234567890_abc123",
  "vfdReference": "VFD_REF_123"
}
```

#### Validate OTP
- **Endpoint**: `POST /api/funding/card/validate-otp`
- **Request Body**:
```json
{
  "reference": "card_1234567890_abc123",
  "otp": "123456"
}
```

- **Response**:
```json
{
  "message": "Payment completed successfully",
  "newBalanceInKobo": 500000,
  "reference": "card_1234567890_abc123"
}
```

### 3. Component Usage

```tsx
import { VFDCardPayment } from '@/components/add-money/vfd-card-payment';

function AddMoneyPage() {
  return (
    <VFDCardPayment
      onSuccess={(amount, reference) => {
        console.log('Payment successful:', amount, reference);
        // Refresh balance, show success message, etc.
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}
```

## Testing

### Test Cards (VFD Sandbox)
Use these test cards in development:

**Successful Payment:**
- Card Number: `5061020000000000094`
- Expiry: `12/25` (YYMM format: `2512`)
- CVV: `123`
- PIN: `1234`

**OTP Required:**
- Card Number: `5061020000000000102`
- Expiry: `12/25`
- CVV: `123`
- PIN: `1234`
- Test OTP: `123456`

**Insufficient Funds:**
- Card Number: `5061020000000000110`
- Expiry: `12/25`
- CVV: `123`
- PIN: `1234`

### Testing Checklist
- [ ] Card payment without OTP
- [ ] Card payment with OTP
- [ ] Invalid card details
- [ ] Insufficient funds
- [ ] Network timeout handling
- [ ] Balance update after successful payment
- [ ] Transaction history logging
- [ ] Notification creation

## Security Features

1. **Card PIN Encryption**: Card PINs are never stored and are transmitted securely
2. **Token Caching**: Access tokens are cached to reduce API calls
3. **Idempotency**: Duplicate transactions are prevented using reference IDs
4. **Pending Payments**: Payments are tracked in `pending_payments` table
5. **Transaction Logging**: All transactions are logged for audit trail

## Troubleshooting

### Common Issues

**1. "VFD credentials not configured"**
- Ensure `VFD_CONSUMER_KEY` and `VFD_CONSUMER_SECRET` are set in `.env.local`
- Restart the dev server after adding environment variables

**2. "Failed to authenticate with payment gateway"**
- Check if your VFD credentials are valid
- Verify you're using the correct API base URL (test vs production)
- Check VFD API status

**3. "OTP validation failed"**
- Ensure the OTP is entered within the validity period (usually 5 minutes)
- Verify the reference matches the initiated payment
- Check if the payment is still in pending state

**4. "Pending payment not found"**
- The payment may have already been processed
- Check the transaction history
- Verify the reference ID is correct

### Debug Mode

Enable detailed logging by checking the browser console and server logs:
```bash
npm run dev
```

Look for logs prefixed with `[VFD]` for detailed API interaction logs.

## Production Checklist

Before going live:
- [ ] Update VFD API URLs to production endpoints
- [ ] Use production VFD credentials
- [ ] Test with real cards in production environment
- [ ] Set up monitoring for failed payments
- [ ] Configure webhook for payment status updates
- [ ] Implement retry logic for failed API calls
- [ ] Set up alerts for authentication failures
- [ ] Review and test error handling
- [ ] Ensure PCI compliance for card data handling

## Support

For VFD API issues:
- VFD Documentation: https://vbaas-docs.vfdtech.ng/
- VFD Support: support@vfdtech.ng

For app-specific issues:
- Check server logs: `npm run dev`
- Review transaction history in database
- Check pending_payments table for stuck transactions
