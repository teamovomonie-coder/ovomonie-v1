# Quick Start Guide - Post-Fixes

All critical fixes have been applied. Follow these steps to complete the setup:

## 1. Apply Database Migration

### Option A: Via Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `supabase/migrations/20250126000000_atomic_transfers.sql`
5. Paste and click **Run**
6. Verify success message

### Option B: Via Script
```bash
npm run migrate
```

### Verify Migration
Run this SQL in Supabase SQL Editor:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'process_internal_transfer';
```
Should return one row.

---

## 2. Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

This applies:
- ✅ 15-second Supabase timeout
- ✅ Fixed CORS settings
- ✅ Updated auth context
- ✅ Improved error handling

---

## 3. Test Connection Health

```bash
# One-time test
npm run monitor:db

# Continuous monitoring (every 30s)
npm run monitor:db:watch
```

Expected output:
```
✅ Health Check... OK
✅ Query Performance... 150ms
✅ Connection Pooling... 5 concurrent queries in 200ms
```

If you see timeouts, check:
- Internet connection
- Supabase project status
- Firewall/proxy settings

---

## 4. Test Atomic Transfers

### Setup Test
1. Login to your app
2. Open browser DevTools > Application > Local Storage
3. Copy the value of `ovo-auth-token`
4. Open `scripts/test-atomic-transfers.js`
5. Update `TEST_CONFIG`:
```javascript
const TEST_CONFIG = {
  senderToken: 'your-token-here',
  recipientAccount: 'recipient-account-number',
  transferAmount: 100,
  concurrentRequests: 5
};
```

### Run Test
```bash
npm run test:transfers
```

Expected output:
```
✅ Successful: 5
❌ Failed: 0
✅ Balance is correct! No race condition detected.
✅ Duplicate prevention working correctly!
```

---

## 5. Monitor Logs

### Check for Connection Errors
```bash
# In dev server terminal, watch for:
[AuthContext] Balance changed: 0 -> 50000
✅ No timeout errors
```

### Check Structured Logs
All API routes now use structured logging:
```json
{
  "level": "info",
  "message": "Internal transfer successful",
  "timestamp": "2025-12-26T16:30:00.000Z",
  "meta": {
    "userId": "...",
    "amount": 10000,
    "reference": "TXN_..."
  }
}
```

---

## 6. Verify Security Features

### CORS
Try accessing API from different origin:
```bash
curl -H "Origin: https://malicious-site.com" http://localhost:3000/api/wallet/balance
# Should fail with CORS error
```

### Rate Limiting
Make 6 rapid login attempts:
```bash
# Should get 429 after 5 attempts
```

### CSRF Protection
Try POST without CSRF token:
```bash
curl -X POST http://localhost:3000/api/transfers/internal \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
# Should get 403 Forbidden
```

---

## 7. Production Checklist

Before deploying:

- [ ] Migration applied to production database
- [ ] Environment variables set in deployment platform
- [ ] CORS origins updated in `src/middleware.ts`
- [ ] Supabase connection pooling enabled
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] Load testing completed
- [ ] Security audit passed

---

## Troubleshooting

### Connection Timeouts Still Occurring
1. Check Supabase project status
2. Verify environment variables are correct
3. Test with `npm run monitor:db`
4. Check network/firewall settings
5. Consider using Supabase connection pooler

### Migration Fails
1. Check Supabase service role key is correct
2. Verify database permissions
3. Apply manually via SQL Editor
4. Check for existing function conflicts

### Transfers Not Atomic
1. Verify migration was applied successfully
2. Check function exists in database
3. Review API route is calling `process_internal_transfer`
4. Check database logs for errors

### Rate Limiting Too Strict
Adjust in `src/lib/middleware/rate-limit.ts`:
```javascript
transfer: rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20, // Increase this
  message: '...'
})
```

---

## Next Steps (Optional)

### Enable TypeScript Strict Mode
1. Update `tsconfig.json`: `"strict": true`
2. Fix type errors: `npm run typecheck`
3. Commit fixes

### Add Redis for Rate Limiting
1. Install: `npm install ioredis`
2. Update `src/lib/middleware/rate-limit.ts`
3. Use Redis instead of in-memory Map

### Implement WebSockets
1. Replace balance polling with WebSocket
2. Real-time balance updates
3. Reduced server load

### Add APM Monitoring
1. Install Sentry/DataDog
2. Track errors and performance
3. Set up alerts

---

## Support

If you encounter issues:
1. Check logs in dev server terminal
2. Review `FIXES_APPLIED_2025.md`
3. Test with monitoring scripts
4. Check Supabase dashboard for errors

All fixes are documented in:
- `FIXES_APPLIED_2025.md` - Complete fix summary
- `MIGRATION_INSTRUCTIONS.md` - Migration details
- This file - Quick start guide
