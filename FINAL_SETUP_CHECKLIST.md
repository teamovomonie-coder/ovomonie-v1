# ✅ Virtual Card - Final Setup Checklist

## Your Current Status

✅ `.env.local` - Perfectly configured  
✅ VFD Credentials - Present  
✅ Webhook Secret - Added  
✅ Database Migration - Ready to apply  

---

## Do These 3 Things Now

### ☐ 1. Apply Database Migration

**In Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: SQL Editor → New Query
4. Copy ALL from: `supabase/migrations/20250126000001_virtual_cards.sql`
5. Paste and click "Run"

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('card_requests', 'virtual_cards', 'card_transactions');
-- Should return: 3
```

### ☐ 2. Register Webhook (CORRECT COMMAND)

You used the wrong parameter. Here's the correct command:

**WRONG (what you tried):**
```bash
node scripts/register-vfd-webhook.js https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards/ a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4c1b7a3f9e6d2c8b5a1f4
# ❌ Second parameter should be VFD_ACCESS_TOKEN, not webhook secret
```

**CORRECT:**
```bash
node scripts/register-vfd-webhook.js https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4NjcwNSIsInRva2VuSWQiOiI1NjAwY2Q5ZC03ZWNhLTRiYzYtOWM0Mi1kM2RiNTdiOWI0ZWIiLCJpYXQiOjE3NjU4MjE5MjAsImV4cCI6OTIyMzM3MjAzNjg1NDc3NX0.Y8nfEGx7C_Blim3O0HPEcmEXMc37ybv6WDbQOlGbGBAVl4b3r-G9HrM_EoeYRgexj4FsarjtxzpBbDh-Poowrg
```

**Or use the script to get fresh token:**
```bash
# Step 1: Get VFD token
node scripts/get-vfd-token.js

# Step 2: Copy the token and run
node scripts/register-vfd-webhook.js https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards YOUR_COPIED_TOKEN
```

### ☐ 3. Test Card Creation

```bash
# Get your auth token from browser localStorage (key: ovo-auth-token)

curl -X POST https://ovomonie-v1.vercel.app/api/cards/virtual-new \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardName": "Test Card"}'
```

---

## Your Perfect .env.local

Your file is already perfect! Here's what you have:

```env
✅ AUTH_SECRET - Set
✅ SUPABASE_URL - Set
✅ SUPABASE_ANON_KEY - Set
✅ SUPABASE_SERVICE_ROLE_KEY - Set
✅ VFD_CONSUMER_KEY - Set
✅ VFD_CONSUMER_SECRET - Set
✅ VFD_ACCESS_TOKEN - Set (long-lived token)
✅ VFD_WEBHOOK_SECRET - Set
✅ All VFD API Base URLs - Set
```

**No changes needed!** ✅

---

## Understanding the Parameters

### Webhook Registration Command:
```bash
node scripts/register-vfd-webhook.js <WEBHOOK_URL> <VFD_ACCESS_TOKEN>
```

**Parameter 1: WEBHOOK_URL**
- Your webhook endpoint
- Must be HTTPS in production
- Example: `https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards`

**Parameter 2: VFD_ACCESS_TOKEN** (NOT webhook secret!)
- Your VFD API access token
- From `.env.local`: `VFD_ACCESS_TOKEN`
- Or get fresh: `node scripts/get-vfd-token.js`

**Webhook Secret** (separate, not in command)
- Used by YOUR webhook to verify VFD's signature
- Already in `.env.local`: `VFD_WEBHOOK_SECRET`
- VFD will use this to sign webhook requests

---

## Quick Test

### Test 1: Webhook Endpoint
```bash
curl https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```
**Expected**: 403 Invalid signature (correct - endpoint is working)

### Test 2: Get VFD Token
```bash
node scripts/get-vfd-token.js
```
**Expected**: Token printed to console

### Test 3: Register Webhook
```bash
node scripts/register-vfd-webhook.js https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards YOUR_TOKEN
```
**Expected**: "✅ Webhook registered successfully!"

---

## Troubleshooting

### "Failed to get VFD token"
- VFD API might be down temporarily
- Use existing `VFD_ACCESS_TOKEN` from `.env.local` (it's long-lived)
- Command: Use the token directly from your `.env.local`

### "Webhook registration failed"
- Check your Vercel app is deployed
- Verify URL is accessible: https://ovomonie-v1.vercel.app
- Try with existing `VFD_ACCESS_TOKEN` from `.env.local`

### "Invalid token"
- Don't use webhook secret as token
- Use `VFD_ACCESS_TOKEN` from `.env.local`
- Or get fresh token with `node scripts/get-vfd-token.js`

---

## Summary

**Your Setup:**
- ✅ Environment variables: Perfect
- ✅ VFD credentials: Present
- ✅ Webhook secret: Configured
- ⏳ Database migration: Needs to be applied
- ⏳ Webhook registration: Use correct command above

**Next Steps:**
1. Apply database migration in Supabase
2. Register webhook with correct VFD token
3. Test card creation

**You're 95% done!** 🚀
