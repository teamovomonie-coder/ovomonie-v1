# VFD Webhook Registration - Manual Guide

## ✅ Step 1: Webhook Secret Added

Your `.env.local` now has:
```
VFD_WEBHOOK_SECRET=a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4c1b7a3f9e6d2c8b5a1f4
```

## ✅ Step 2: Webhook Endpoint Ready

Your webhook is live at:
- **Local**: `http://localhost:3000/api/webhooks/vfd-cards`
- **Production**: `https://your-domain.com/api/webhooks/vfd-cards`

## 📋 Step 3: Register with VFD

### Option A: Via VFD Dashboard (Recommended)

1. **Login to VFD Portal**
   - Go to: https://portal-devapps.vfdbank.systems
   - Login with your VFD credentials

2. **Navigate to Webhooks**
   - Click: Settings → Webhooks
   - Click: "Add New Webhook"

3. **Configure Webhook**
   ```
   Webhook URL: https://your-domain.com/api/webhooks/vfd-cards
   
   Events to Subscribe:
   ✅ virtual_card.created
   ✅ virtual_card.activated
   ✅ virtual_card.failed
   ✅ virtual_card.blocked
   
   Secret: a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4c1b7a3f9e6d2c8b5a1f4
   ```

4. **Save & Test**
   - Click "Save"
   - Click "Test Webhook" to verify

### Option B: Via API (For Local Testing)

**For local development, use ngrok:**

1. **Install ngrok**
   ```bash
   # Download from: https://ngrok.com/download
   npm install -g ngrok
   ```

2. **Start ngrok**
   ```bash
   ngrok http 3000
   ```
   
   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. **Register via cURL**
   ```bash
   curl -X POST https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/webhooks \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_VFD_TOKEN" \
     -d '{
       "url": "https://abc123.ngrok.io/api/webhooks/vfd-cards",
       "events": [
         "virtual_card.created",
         "virtual_card.activated", 
         "virtual_card.failed",
         "virtual_card.blocked"
       ],
       "secret": "a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4c1b7a3f9e6d2c8b5a1f4"
     }'
   ```

### Option C: Contact VFD Support

If you don't have dashboard access:

1. **Email VFD Support**
   - To: support@vfdtech.ng
   - Subject: "Webhook Registration for Virtual Cards"
   
2. **Provide Details**
   ```
   Webhook URL: https://your-domain.com/api/webhooks/vfd-cards
   
   Events Needed:
   - virtual_card.created
   - virtual_card.activated
   - virtual_card.failed
   - virtual_card.blocked
   
   Webhook Secret: a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4c1b7a3f9e6d2c8b5a1f4
   
   Account: [Your VFD Account ID]
   ```

## 🧪 Test Webhook

### Test 1: Check Endpoint is Live

```bash
curl http://localhost:3000/api/webhooks/vfd-cards \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-vfd-signature: test" \
  -d '{"type":"test","data":{}}'
```

**Expected**: 403 Invalid signature (this is correct - means endpoint is working)

### Test 2: Create a Virtual Card

Once webhook is registered, create a card and watch for webhook delivery:

```bash
# In your dev server terminal, you'll see:
[INFO] VFD webhook received { event: 'virtual_card.created', reference: 'VCARD_...' }
[INFO] Card activated via webhook { cardId: 'vfd_123' }
```

## 📊 Webhook Events

Your webhook handles these events:

| Event | Action |
|-------|--------|
| `virtual_card.created` | Marks card as active |
| `virtual_card.activated` | Marks card as active |
| `virtual_card.failed` | Refunds user automatically |
| `virtual_card.blocked` | Marks card as blocked |

## 🔒 Security

Your webhook verifies signatures using:
- Secret: `VFD_WEBHOOK_SECRET` from `.env.local`
- Algorithm: HMAC-SHA256
- Header: `x-vfd-signature`

## ✅ Verification Checklist

- [ ] Webhook secret added to `.env.local`
- [ ] Dev server restarted
- [ ] Webhook registered with VFD
- [ ] Test webhook delivery successful
- [ ] Card creation tested end-to-end

## 🆘 Troubleshooting

### Webhook not receiving events
- Check webhook URL is accessible (use ngrok for local)
- Verify webhook is registered in VFD dashboard
- Check VFD webhook logs

### Signature verification fails
- Ensure `VFD_WEBHOOK_SECRET` matches what you gave VFD
- Check header name is `x-vfd-signature`
- Verify secret is correct in both places

### Events not processing
- Check dev server logs for errors
- Verify database functions exist
- Test webhook endpoint manually

## 📝 Notes

- **Local Development**: Use ngrok to expose localhost
- **Production**: Use your actual domain with HTTPS
- **Webhook Secret**: Keep this secret, don't commit to git
- **Testing**: VFD usually has a "Test Webhook" button in dashboard

## 🎉 You're Done!

Once webhook is registered:
1. Create a virtual card
2. VFD will call your webhook
3. Card status will be updated automatically
4. User will see active card

**Status**: Webhook configured ✅
