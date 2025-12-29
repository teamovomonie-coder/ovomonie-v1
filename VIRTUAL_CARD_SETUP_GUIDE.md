# Virtual Card Setup - Complete Guide

## ✅ Checklist

- [ ] Database migration applied
- [ ] VFD credentials configured
- [ ] Webhook registered with VFD
- [ ] System tested

---

## Step 1: Apply Database Migration (5 min)

### Via Supabase Dashboard

1. **Open Supabase**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" (left sidebar)
   - Click "New Query"

3. **Run Migration**
   - Open: `supabase/migrations/20250126000001_virtual_cards.sql`
   - Copy ALL content
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait for "Success" message

4. **Verify**
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('card_requests', 'virtual_cards', 'card_transactions');
   -- Should return 3 rows

   -- Check functions
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%virtual_card%';
   -- Should return 3 functions
   ```

✅ **Done!** Database is ready.

---

## Step 2: Configure VFD Credentials (2 min)

1. **Add to `.env.local`**
   ```env
   # VFD Virtual Card API
   VFD_CONSUMER_KEY=your_vfd_consumer_key_here
   VFD_CONSUMER_SECRET=your_vfd_consumer_secret_here
   VFD_WEBHOOK_SECRET=your_random_secret_here
   ```

2. **Generate Webhook Secret**
   ```bash
   # Generate random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Restart Dev Server**
   ```bash
   npm run dev
   ```

✅ **Done!** Credentials configured.

---

## Step 3: Register Webhook with VFD (5 min)

### For Local Development (Using ngrok)

1. **Install ngrok**
   - Download: https://ngrok.com/download
   - Or: `npm install -g ngrok`

2. **Start ngrok**
   ```bash
   ngrok http 3000
   ```
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. **Get VFD Token**
   ```bash
   node scripts/get-vfd-token.js
   ```
   - Copy the access token

4. **Register Webhook**
   ```bash
   node scripts/register-vfd-webhook.js https://abc123.ngrok.io/api/webhooks/vfd-cards YOUR_TOKEN
   ```

### For Production

1. **Deploy Your App**
   - Deploy to Vercel/Netlify/etc.
   - Get your production URL

2. **Get VFD Token**
   ```bash
   node scripts/get-vfd-token.js
   ```

3. **Register Webhook**
   ```bash
   node scripts/register-vfd-webhook.js https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4NjcwNSIsInRva2VuSWQiOiI1NjAwY2Q5ZC03ZWNhLTRiYzYtOWM0Mi1kM2RiNTdiOWI0ZWIiLCJpYXQiOjE3NjU4MjE5MjAsImV4cCI6OTIyMzM3MjAzNjg1NDc3NX0.Y8nfEGx7C_Blim3O0HPEcmEXMc37ybv6WDbQOlGbGBAVl4b3r-G9HrM_EoeYRgexj4FsarjtxzpBbDh-Poowrg

   ```

✅ **Done!** Webhook registered.

---

## Step 4: Test the System (5 min)

### Test 1: Create Virtual Card

```bash
# Get your auth token from browser localStorage
# Key: ovo-auth-token

curl -X POST http://localhost:3000/api/cards/virtual-new \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardName": "Test Card"}'
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Virtual card created successfully",
  "data": {
    "cardId": "vfd_123...",
    "maskedPan": "4000****1234",
    "expiryMonth": "12",
    "expiryYear": "25",
    "status": "active",
    "newBalance": 450000
  }
}
```

### Test 2: List Cards

```bash
curl http://localhost:3000/api/cards/virtual-new \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Test 3: Check Database

```sql
-- Check card request
SELECT * FROM card_requests ORDER BY created_at DESC LIMIT 1;

-- Check virtual card
SELECT * FROM virtual_cards ORDER BY created_at DESC LIMIT 1;

-- Check transactions
SELECT * FROM card_transactions ORDER BY created_at DESC LIMIT 2;
```

✅ **Done!** System is working.

---

## Troubleshooting

### Migration Failed

**Error: "relation already exists"**
- Tables already exist, skip migration
- Or drop tables first (⚠️ deletes data):
  ```sql
  DROP TABLE IF EXISTS card_transactions CASCADE;
  DROP TABLE IF EXISTS virtual_cards CASCADE;
  DROP TABLE IF EXISTS card_requests CASCADE;
  ```

**Error: "function already exists"**
- Functions already exist, use `CREATE OR REPLACE`
- Already in migration file, just re-run

### VFD Token Failed

**Error: "Invalid credentials"**
- Check `VFD_CONSUMER_KEY` and `VFD_CONSUMER_SECRET`
- Verify they're in `.env.local`
- Restart dev server

**Error: "Token expired"**
- Tokens expire in 1 hour
- Run `node scripts/get-vfd-token.js` again

### Webhook Registration Failed

**Error: "URL not accessible"**
- For local: Use ngrok HTTPS URL
- For production: Ensure app is deployed
- Test webhook URL in browser

**Error: "Invalid token"**
- Get fresh token: `node scripts/get-vfd-token.js`
- Token expires in 1 hour

### Card Creation Failed

**Error: "KYC_REQUIRED"**
- User needs KYC tier 2+
- Update user: `UPDATE users SET kyc_tier = 2 WHERE id = 'USER_ID'`

**Error: "INSUFFICIENT_BALANCE"**
- User needs ₦1000 minimum
- Add balance: `UPDATE users SET balance = balance + 100000 WHERE id = 'USER_ID'`

**Error: "CARD_EXISTS"**
- User already has active card
- One card per user limit
- Block old card first

---

## Quick Commands

```bash
# Get VFD token
node scripts/get-vfd-token.js

# Register webhook (local)
ngrok http 3000
node scripts/register-vfd-webhook.js https://YOUR_NGROK_URL/api/webhooks/vfd-cards TOKEN

# Register webhook (production)
node scripts/register-vfd-webhook.js https://your-domain.com/api/webhooks/vfd-cards TOKEN

# Test card creation
curl -X POST http://localhost:3000/api/cards/virtual-new \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardName": "Test"}'

# Monitor logs
npm run dev
# Watch for: "Card request created, funds locked"
```

---

## Next Steps

1. **Build UI** - Create card creation interface
2. **Add Card Management** - Block/unblock cards
3. **Show Transactions** - Display card usage
4. **Add Notifications** - Real-time updates
5. **Set Limits** - Spending limits per card

---

## Support

**Documentation:**
- Full guide: `VIRTUAL_CARD_IMPLEMENTATION.md`
- Quick ref: `VIRTUAL_CARD_QUICK_REF.md`

**Common Issues:**
- Migration: Check Supabase SQL Editor
- VFD: Verify credentials in `.env.local`
- Webhook: Use HTTPS (ngrok for local)

**Status:** Production-ready ✅
