# Card Payment Flow - Complete Implementation

## Overview
All card transactions now follow a standardized flow using the `pending_payments` table to ensure balance updates are always applied upon successful completion.

## Flow Architecture

### 1. Payment Initiation
**Endpoint**: `/api/vfd/cards/initiate`

**Process**:
1. User submits card details and amount
2. System stores payment in `pending_payments` table:
   - `reference`: Unique payment reference
   - `user_id`: User making the payment
   - `amount`: Amount in kobo (Naira × 100)
   - `status`: 'pending'
3. VFD payment gateway is called to initiate payment
4. Returns OTP/PIN requirement to user

### 2. Payment Authorization (Multiple Paths)

#### Path A: OTP Validation
**Endpoint**: `/api/vfd/cards/validate-otp`

**Process**:
1. User submits OTP and reference
2. VFD validates OTP
3. On success:
   - Retrieve amount from `pending_payments` table
   - Update user balance in `users` table
   - Create record in `financial_transactions`
   - Mark payment as 'completed' in `pending_payments`
   - Create notification
   - Return new balance to frontend

#### Path B: OTP Authorization
**Endpoint**: `/api/vfd/cards/authorize-otp`

**Process**: Same as Path A

#### Path C: PIN Authorization
**Endpoint**: `/api/vfd/cards/authorize-pin`

**Process**: Same as Path A, but uses PIN instead of OTP

#### Path D: Status Check
**Endpoint**: `/api/vfd/cards/status`

**Process**:
1. Query VFD for payment status
2. On success:
   - Retrieve amount from `pending_payments` table (if VFD doesn't return it)
   - Update user balance in `users` table
   - Create record in `financial_transactions`
   - Mark payment as 'completed' in `pending_payments`
   - Create notification
   - Return new balance to frontend

## Database Schema

### pending_payments Table
```sql
CREATE TABLE pending_payments (
  reference TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Fields
- **reference**: Unique payment identifier (Primary Key)
- **user_id**: Links to users table
- **amount**: Payment amount in kobo (1 Naira = 100 kobo)
- **status**: 'pending' or 'completed'

## Balance Update Flow

```
┌─────────────────┐
│   Initiate      │
│   Payment       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store in        │
│ pending_payments│
│ status='pending'│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ VFD Gateway     │
│ Processing      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Authorization (OTP/PIN/Status)  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Success?        │
└────┬────────┬───┘
     │ Yes    │ No
     ▼        ▼
┌─────────┐  ┌──────────┐
│ Retrieve│  │ Return   │
│ amount  │  │ error    │
│ from    │  └──────────┘
│ pending │
│ payments│
└────┬────┘
     │
     ▼
┌─────────────────┐
│ Update users    │
│ balance         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create          │
│ transaction     │
│ record          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mark pending    │
│ payment as      │
│ 'completed'     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create          │
│ notification    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return new      │
│ balance to UI   │
└─────────────────┘
```

## Key Features

### 1. Guaranteed Balance Updates
- Every successful payment updates the balance
- Amount is always available from `pending_payments` table
- No dependency on VFD returning the amount

### 2. Duplicate Prevention
- Checks for existing transactions before creating new ones
- Uses `reference` as unique identifier
- Prevents double-crediting

### 3. Comprehensive Logging
- All steps logged with structured JSON
- Easy debugging and audit trail
- Tracks amount retrieval source

### 4. Multiple Authorization Paths
- Supports OTP validation
- Supports OTP authorization
- Supports PIN authorization
- Supports status polling

### 5. Frontend Integration
- Returns `newBalanceInKobo` in response
- Triggers balance refresh events
- Updates UI automatically

## Error Handling

### Missing Amount
- Falls back to `pending_payments` table
- Logs the fallback for monitoring
- Never fails due to missing amount

### Duplicate Transactions
- Checks `financial_transactions` before inserting
- Uses `reference` to detect duplicates
- Prevents balance corruption

### Network Timeouts
- Status endpoint can recover stuck payments
- Multiple retry attempts with delays
- Optimistic balance updates when needed

## Testing Checklist

- [ ] Initiate payment stores in `pending_payments`
- [ ] OTP validation updates balance
- [ ] OTP authorization updates balance
- [ ] PIN authorization updates balance
- [ ] Status check updates balance
- [ ] Duplicate payments are prevented
- [ ] Notifications are created
- [ ] Frontend balance refreshes
- [ ] All amounts in kobo (not Naira)
- [ ] Pending payments marked as completed

## Monitoring

### Key Metrics
- Pending payments count (should decrease over time)
- Completed payments count
- Failed authorization attempts
- Balance update failures

### Log Queries
```
# Find pending payments older than 1 hour
SELECT * FROM pending_payments 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

# Find transactions without corresponding pending payment
SELECT ft.* FROM financial_transactions ft
LEFT JOIN pending_payments pp ON ft.reference = pp.reference
WHERE pp.reference IS NULL
AND ft.category = 'deposit';
```

## Maintenance

### Cleanup Old Pending Payments
```sql
-- Mark abandoned payments as failed after 24 hours
UPDATE pending_payments 
SET status = 'failed', updated_at = NOW()
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '24 hours';
```

### Reconciliation
```sql
-- Find completed payments without transactions
SELECT pp.* FROM pending_payments pp
LEFT JOIN financial_transactions ft ON pp.reference = ft.reference
WHERE pp.status = 'completed'
AND ft.reference IS NULL;
```
