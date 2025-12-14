# VFD Payment Integration Guide

This document outlines the complete VFD API integration for all payment transactions in the Ovomonie app.

## Overview

The VFD payment system provides a unified interface for processing various payment types through VFD Bank's APIs:
- Card Funding (debit/credit cards)
- Bill Payments
- Airtime Top-ups
- Betting Deposits
- Loans
- Transfers
- And more

## Architecture

### Core Components

1. **`src/lib/vfd.ts`** - Low-level VFD API client
   - Token exchange and caching
   - Direct API calls to VFD endpoints
   - Support for JWT tokens and legacy credentials

2. **`src/lib/vfd-processor.ts`** - Payment processor layer
   - High-level payment operations
   - OTP validation
   - Transaction logging
   - Payment status checking

3. **`src/app/api/payments/vfd/route.ts`** - Backend API route
   - REST endpoint for frontend payment requests
   - Idempotency support
   - Request/response handling

4. **`src/hooks/use-vfd-payment.ts`** - React hooks
   - Client-side payment management
   - State management
   - Multiple payment type hooks

5. **`src/components/add-money/vfd-card-payment.tsx`** - UI Component
   - Card payment form
   - OTP input dialog
   - PIN confirmation

## Payment Flow

### Card Payment Flow

```
User enters card details
        ↓
User confirms with PIN
        ↓
API initiates payment via VFD
        ↓
[OTP Required?]
├─ YES → Send OTP to phone
│        ↓
│        User enters OTP
│        ↓
│        API validates OTP
│        ↓
│        Payment completed
│
└─ NO  → Payment completed immediately
```

## Usage Examples

### Using React Hooks (Frontend)

```typescript
import { useCardPayment } from '@/hooks/use-vfd-payment';

function MyComponent() {
  const cardPayment = useCardPayment();

  const handleCardPayment = async (amount: number, cardDetails: any) => {
    const success = await cardPayment.initiatePayment({
      amount,
      reference: `card_${Date.now()}`,
      category: 'card_funding',
      description: 'Wallet funding',
      ...cardDetails,
    });

    if (success && cardPayment.requiresOTP) {
      // Show OTP input
      const otpValid = await cardPayment.validateOTP(userOTP);
      if (otpValid) {
        // Payment successful
      }
    }
  };

  return (
    <VFDCardPayment 
      onSuccess={(amount) => console.log(`Paid: ₦${amount}`)}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Using the API Directly (Backend)

```typescript
import { processVFDPayment } from '@/lib/vfd-processor';

const result = await processVFDPayment(userId, {
  userId,
  amount: 5000,
  reference: 'card_12345',
  category: 'card_funding',
  description: 'Card wallet funding',
  cardNumber: '4532...',
  cardPin: '1234',
  cvv2: '123',
  expiryDate: '1225', // YYMM format
});

if (result.success) {
  // Payment completed
} else if (result.requiresOTP) {
  // Ask user for OTP
}
```

## Payment Categories

The system supports the following payment categories:

- `card_funding` - Debit/Credit card deposits
- `bill_payment` - Utility bills
- `airtime` - Mobile airtime top-ups
- `betting` - Betting platform deposits
- `loan_payment` - Loan repayments
- `transfer` - Money transfers
- `shopping` - Online shopping
- `food_delivery` - Food ordering
- `ride` - Ride hailing services
- `flight` - Flight bookings
- `hotel` - Hotel bookings

## API Endpoints

### POST /api/payments/vfd

**Actions:**
- `initiate` - Initiate a payment
- `validate-otp` - Validate OTP for payment confirmation
- `status` - Check payment status

**Initiate Payment Request:**
```json
{
  "action": "initiate",
  "amount": 5000,
  "reference": "card_12345",
  "category": "card_funding",
  "description": "Wallet funding via card",
  "cardNumber": "4532123456789010",
  "cardPin": "1234",
  "cvv": "123",
  "expiry": "12/25",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Initiate Payment Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "reference": "card_12345",
  "status": "processing",
  "vfdReference": "VFD_12345_ABC",
  "requiresOTP": true,
  "data": {
    "amount": 5000,
    "status": "pending"
  }
}
```

**Validate OTP Request:**
```json
{
  "action": "validate-otp",
  "reference": "VFD_12345_ABC",
  "otp": "123456"
}
```

**Status Check:**
```
GET /api/payments/vfd?reference=card_12345
```

## Environment Variables

Required for VFD integration:

```env
# VFD API Configuration
VFD_API_BASE=https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards
VFD_TOKEN_URL=https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token

# VFD Credentials (one of these is required)
VFD_ACCESS_TOKEN=your-access-token           # Pre-obtained token
VFD_CONSUMER_KEY=your-consumer-key           # For OAuth2 exchange
VFD_CONSUMER_SECRET=your-consumer-secret     # For OAuth2 exchange
```

## Error Handling

The system returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (validation error, insufficient funds, etc.)
- `401` - Unauthorized (invalid token)
- `500` - Server error

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "reference": "card_12345"
}
```

## Transaction Logging

All transactions are logged to Firestore in the `financialTransactions` collection:

```typescript
{
  userId: "user_123",
  reference: "card_12345",
  vfdReference: "VFD_ABC123",
  type: "debit",
  category: "card_funding",
  amount: 500000, // in kobo
  description: "Card wallet funding",
  status: "completed",
  paymentGateway: "VFD",
  metadata: {
    // Custom metadata
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Testing

### Test Card Numbers

VFD provides test card numbers for development:
- Visa: 4532123456789010 (Pin: 1234, CVV: 123)
- Mastercard: 5425233010103010 (Pin: 1234, CVV: 123)

### Local Testing

1. Ensure `.env.local` contains valid VFD credentials
2. Start dev server: `npm run dev`
3. Navigate to Add Money → Card Payment
4. Enter test card details
5. Confirm with PIN
6. Enter test OTP when prompted (check server logs for OTP)

## Troubleshooting

### Token Exchange Fails

- Check VFD_CONSUMER_KEY and VFD_CONSUMER_SECRET are correct
- Verify VFD_TOKEN_URL is accessible
- Check server logs for detailed error messages

### OTP Not Received

- Verify phone number on file with VFD
- Check SMS logs
- OTP may be printed in server logs for test environment

### Payment Status Stuck at "Pending"

- Use status endpoint to check VFD status
- Verify transaction reference is correct
- Check VFD dashboard for payment status

## Security Considerations

1. **Card Data**: Never log full card details. Always mask sensitive data.
2. **PIN/OTP**: Never store or transmit insecurely. Use HTTPS only.
3. **Token Rotation**: VFD tokens are cached with expiry. Auto-refresh on expiration.
4. **Idempotency**: All payment endpoints check for duplicate references.
5. **Firestore Rules**: Set appropriate security rules for financialTransactions collection.

## Future Enhancements

- [ ] Webhook support for real-time payment status updates
- [ ] Batch payment processing
- [ ] Recurring payment support
- [ ] Multi-currency support
- [ ] Advanced fraud detection
- [ ] Comprehensive audit logging
- [ ] Rate limiting and throttling
