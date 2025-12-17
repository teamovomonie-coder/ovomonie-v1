# VFD Virtual Accounts Implementation

Complete implementation of VFD virtual account system for Ovomonie wallet integration.

## Architecture Overview

```
User's Internal Wallet (Supabase) ← Ledger/Balance tracking
         ↕
VFD Virtual Account (NUBAN) ← Real bank account for NIP
         ↕
Nigerian Banking System (NIP)
```

## Key Components

### 1. Database Schema (`supabase-migrations/virtual_accounts.sql`)

**Tables:**
- `virtual_accounts` - VFD virtual account mappings
- `wallet_transactions` - Transaction ledger
- `users` - User wallet balances

**Functions:**
- `process_inbound_transfer()` - Atomic credit processing
- `process_outbound_transfer()` - Atomic debit processing
- `refund_failed_transfer()` - Reversal handling

### 2. Core Library (`src/lib/virtual-accounts.ts`)

**Functions:**
- `createUserVirtualAccount()` - Generate VFD virtual accounts
- `processInboundTransfer()` - Handle webhook credits
- `initiateOutboundTransfer()` - Process outbound transfers
- `getWalletBalance()` - Fetch user balance

### 3. VFD Integration (`src/lib/vfd-transfer.ts`)

**Functions:**
- `executeVFDTransfer()` - Send money via VFD
- `validateRecipient()` - Name enquiry
- `checkTransferStatus()` - Transaction status

### 4. API Routes

**Endpoints:**
- `POST /api/virtual-accounts/create` - Create virtual account
- `POST /api/webhooks/vfd` - VFD webhook handler
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/transfer` - Initiate transfer

### 5. React Components

**Components:**
- `VirtualAccountFunding` - Generate funding accounts
- `VFDTransfer` - Send money to banks
- `useVirtualAccounts` - React hook

## Flow Diagrams

### Inbound Transfer (Bank → Wallet)

```
1. User requests virtual account
2. VFD creates temporary NUBAN
3. User transfers from any bank to NUBAN
4. VFD sends webhook to /api/webhooks/vfd
5. System credits user wallet atomically
6. Virtual account marked as used
```

### Outbound Transfer (Wallet → Bank)

```
1. User initiates transfer
2. System debits wallet (pending)
3. VFD processes bank transfer
4. On success: mark completed
5. On failure: refund user wallet
```

## Environment Variables

Required in `.env.local`:

```bash
# VFD API Configuration
VFD_ACCESS_TOKEN=your_vfd_token
VFD_CONSUMER_KEY=your_consumer_key
VFD_CONSUMER_SECRET=your_consumer_secret
VFD_WALLET_API_BASE=https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deployment Steps

### 1. Database Migration

```bash
# Run the migration
psql -h your-db-host -U postgres -d your-db < supabase-migrations/virtual_accounts.sql
```

### 2. Environment Setup

1. Copy VFD credentials to production environment
2. Set up Supabase service role key
3. Configure webhook URL with VFD

### 3. Webhook Configuration

Register webhook URL with VFD:
- URL: `https://your-domain.com/api/webhooks/vfd`
- Method: POST
- Events: Credit transactions

### 4. Testing

```bash
# Run integration test
node scripts/test-virtual-accounts.js
```

## Security Considerations

### 1. Webhook Validation
- Validate VFD webhook signatures
- Check duplicate transactions
- Rate limit webhook endpoint

### 2. Balance Protection
- Atomic transactions prevent race conditions
- Failed transfers are automatically refunded
- All operations are logged

### 3. Access Control
- JWT token validation on all endpoints
- User can only access own accounts
- Service role key secured server-side

## Monitoring & Alerts

### Key Metrics
- Virtual account creation rate
- Webhook processing time
- Failed transfer rate
- Balance reconciliation accuracy

### Alerts
- Webhook failures
- VFD API errors
- Balance mismatches
- High failure rates

## Troubleshooting

### Common Issues

**Virtual Account Creation Fails**
- Check VFD API credentials
- Verify network connectivity
- Check VFD API limits

**Webhook Not Received**
- Verify webhook URL registration
- Check firewall/security groups
- Test webhook endpoint manually

**Balance Mismatch**
- Check transaction logs
- Verify webhook processing
- Run balance reconciliation

### Debug Commands

```bash
# Check VFD API connectivity
curl -H "AccessToken: $VFD_ACCESS_TOKEN" \
  "$VFD_WALLET_API_BASE/account/enquiry"

# Test webhook endpoint
curl -X POST https://ovomonie-v1.vercel.app/api/webhooks/vfd \
  -H "Content-Type: application/json" \
  -d '{"accountNumber":"1234567890","amount":"1000","transactionType":"CREDIT"}'
```

## Performance Optimization

### Database Indexes
- `idx_virtual_accounts_user_id` - User account lookup
- `idx_wallet_transactions_reference` - Duplicate prevention
- `idx_users_account_number` - Balance queries

### Caching Strategy
- Cache VFD pool account details
- Cache bank list for transfers
- Cache user balances (with TTL)

### Rate Limiting
- Webhook endpoint: 100 req/min
- Virtual account creation: 10 req/min per user
- Transfer initiation: 5 req/min per user

## Compliance & Regulations

### KYC Requirements
- Tier 1: ₦50,000 daily send limit
- Tier 2: ₦500,000 daily send limit
- Tier 3: ₦5,000,000 daily send limit

### AML Monitoring
- Transaction pattern analysis
- Suspicious activity reporting
- Compliance with CBN regulations

### Data Protection
- PII encryption at rest
- Secure API communications
- Audit trail maintenance

## Future Enhancements

### Planned Features
- Bulk transfer processing
- Recurring payment setup
- Multi-currency support
- Advanced analytics dashboard

### Integration Roadmap
- Additional bank partnerships
- Mobile money integration
- International remittances
- Merchant payment gateway

---

**Implementation Status:** ✅ Complete  
**Last Updated:** January 2025  
**Version:** 1.0.0