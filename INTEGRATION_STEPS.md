# VFD Virtual Account Integration Steps

## 1. Test VFD Connection
```bash
node scripts/test-vfd-connection.js
```

## 2. Start Development Server
```bash
npm run dev
```

## 3. Test Virtual Account Creation
Visit: `http://localhost:3000/add-money/virtual-account`

## 4. Test API Endpoints

### Create Virtual Account
```bash
curl -X POST http://localhost:3000/api/virtual-accounts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 100000}'
```

### Check Wallet Balance
```bash
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/vfd \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "amount": "1000",
    "senderName": "Test User",
    "reference": "TEST123",
    "sessionId": "SESSION123",
    "transactionType": "CREDIT"
  }'
```

## 5. Configure VFD Webhook
Register this URL with VFD:
- **URL**: `https://your-domain.vercel.app/api/webhooks/vfd`
- **Method**: POST
- **Events**: Credit transactions

## 6. Production Deployment
1. Deploy to Vercel
2. Update VFD webhook URL to production domain
3. Test end-to-end flow

## 7. Monitor & Debug
- Check Vercel function logs
- Monitor Supabase database
- Track VFD API responses