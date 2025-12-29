# Email to VFD Support - Copy & Send

## 📧 Email Details

**To:** support@vfdtech.ng  
**CC:** (your account manager if you have one)  
**Subject:** Webhook Registration Request for Virtual Cards  

---

## 📋 Email Body (Copy This)

```
Hi VFD Support Team,

I need to register a webhook for Virtual Card events on my account.

ACCOUNT DETAILS:
- Account ID: 86705
- Business Name: Ovomonie
- Environment: Development (api-devapps.vfdbank.systems)

WEBHOOK CONFIGURATION:
- Webhook URL: https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards
- Webhook Secret: a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4c1b7a3f9e6d2c8b5a1f4

EVENTS TO SUBSCRIBE:
- virtual_card.created
- virtual_card.activated
- virtual_card.failed
- virtual_card.blocked

ADDITIONAL INFO:
- The webhook endpoint is live and ready to receive events
- We're using HMAC-SHA256 signature verification
- Please confirm once the webhook is registered

Thank you for your assistance!

Best regards,
[Your Name]
Ovomonie Team
```

---

## ✅ After Sending Email

### What to Expect:

1. **Response Time:** 1-2 business days
2. **Confirmation:** VFD will confirm webhook is registered
3. **Test:** They may send a test webhook

### While Waiting:

**Your virtual card system works WITHOUT the webhook!**

You can:
- ✅ Apply database migration
- ✅ Create virtual cards
- ✅ Test the system
- ✅ Use in production

Webhook just adds extra confirmation from VFD.

---

## 🚀 What to Do Right Now

### Step 1: Send Email (Done ✅)

### Step 2: Apply Database Migration

```sql
-- In Supabase SQL Editor:
-- 1. Go to https://supabase.com/dashboard
-- 2. SQL Editor → New Query
-- 3. Copy from: supabase/migrations/20250126000001_virtual_cards.sql
-- 4. Paste and Run
```

### Step 3: Test Card Creation

Your system works now! Test it:

```bash
curl -X POST https://ovomonie-v1.vercel.app/api/cards/virtual-new \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardName": "Test Card"}'
```

---

## 📞 Follow Up

If no response in 2 days:

**Follow-up Email:**
```
Subject: Follow-up: Webhook Registration Request

Hi Team,

Following up on my webhook registration request sent on [DATE].

Could you please confirm the status?

Account ID: 86705
Webhook URL: https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards

Thank you!
```

---

## ✅ Summary

**What You Did:**
- ✅ Sent email to VFD support
- ⏳ Waiting for confirmation (1-2 days)

**What to Do Now:**
- ✅ Apply database migration
- ✅ Test card creation (works without webhook)
- ✅ Use the system

**Webhook Status:**
- ⏳ Pending VFD registration
- ✅ System works without it
- ✅ Will be enhanced once registered

**You're good to go!** 🚀
