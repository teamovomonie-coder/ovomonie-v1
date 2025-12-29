# VFD Portal Webhook Configuration Guide

## ✅ Correct Webhook Setup in VFD Portal

### Where to Add Your Webhook URL

In VFD Portal, you'll see different webhook categories. Here's what to use:

---

## 🎯 CORRECT: Virtual Card Webhooks

**Location in Portal:**
```
Settings → Webhooks → Virtual Cards
OR
Cards → Virtual Cards → Webhooks
OR
Webhooks → Card Events
```

**Your Webhook URL:**
```
https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards
```

**Events to Subscribe:**
- ✅ `virtual_card.created`
- ✅ `virtual_card.activated`
- ✅ `virtual_card.failed`
- ✅ `virtual_card.blocked`
- ✅ `virtual_card.transaction` (optional - for card usage)

---

## ❌ WRONG: Debit Card Outflow

**Don't use:**
- ❌ Debit Card Outflow - This is for physical debit cards
- ❌ Wallet Outflow - This is for wallet transfers
- ❌ Payment Outflow - This is for general payments

**Why?**
- "Debit Card Outflow" is for **physical debit cards**, not virtual cards
- Virtual cards have their own webhook category
- Using wrong category = no webhook events received

---

## 📋 VFD Portal Configuration Steps

### Step 1: Login to VFD Portal
```
URL: https://portal-devapps.vfdbank.systems
Username: Your VFD username
Password: Your VFD password
```

### Step 2: Navigate to Webhooks

**Option A: Via Settings**
```
Dashboard → Settings → Webhooks → Add New
```

**Option B: Via Cards Section**
```
Dashboard → Cards → Virtual Cards → Webhooks → Configure
```

**Option C: Via Webhooks Menu**
```
Dashboard → Webhooks → Card Events → Add Webhook
```

### Step 3: Fill Webhook Form

```
┌─────────────────────────────────────────────────────┐
│ Add Webhook Configuration                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Webhook Name: Ovomonie Virtual Cards               │
│                                                     │
│ Webhook URL:                                        │
│ https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards │
│                                                     │
│ Category: [Virtual Cards ▼]                        │
│                                                     │
│ Events:                                             │
│ ☑ virtual_card.created                             │
│ ☑ virtual_card.activated                           │
│ ☑ virtual_card.failed                              │
│ ☑ virtual_card.blocked                             │
│ ☐ virtual_card.transaction (optional)              │
│                                                     │
│ Secret Key:                                         │
│ a7f3e9d2c8b4f1a6e5d9c3b7a2f8e4d1c9b6a5f2e8d4... │
│                                                     │
│ Status: [Active ▼]                                 │
│                                                     │
│ [Test Webhook]  [Save Configuration]               │
└─────────────────────────────────────────────────────┘
```

### Step 4: Test Webhook

Click "Test Webhook" button in portal.

**Expected Response:**
```json
{
  "ok": true,
  "received": true
}
```

---

## 🔍 How to Identify Correct Category

### Look for These Keywords:

**✅ CORRECT Categories:**
- "Virtual Cards"
- "Card Issuance"
- "BaaS Cards"
- "Virtual Card Events"
- "Card Management"

**❌ WRONG Categories:**
- "Debit Card Outflow" (physical cards)
- "Wallet Outflow" (wallet transfers)
- "Payment Outflow" (general payments)
- "Transaction Outflow" (all transactions)

---

## 📊 Webhook Event Types

### Virtual Card Events (What You Need)

| Event | When Triggered | Your Action |
|-------|---------------|-------------|
| `virtual_card.created` | Card created successfully | Mark as active |
| `virtual_card.activated` | Card activated by VFD | Mark as active |
| `virtual_card.failed` | Card creation failed | Refund user |
| `virtual_card.blocked` | Card blocked by VFD | Mark as blocked |
| `virtual_card.transaction` | Card used for payment | Log transaction |

### Debit Card Events (NOT for Virtual Cards)

| Event | Purpose | Don't Use For |
|-------|---------|---------------|
| `debit_card.issued` | Physical card issued | Virtual cards |
| `debit_card.activated` | Physical card activated | Virtual cards |
| `debit_card.outflow` | Physical card payment | Virtual cards |

---

## 🎯 Quick Decision Tree

```
Are you creating VIRTUAL cards (online only)?
  ├─ YES → Use "Virtual Cards" webhook category ✅
  └─ NO → Are you issuing PHYSICAL cards?
      ├─ YES → Use "Debit Card" webhook category
      └─ NO → Contact VFD support

Is the webhook for card CREATION/STATUS?
  ├─ YES → Use "Virtual Cards" category ✅
  └─ NO → Is it for card TRANSACTIONS?
      ├─ YES → Use "Virtual Card Transactions" ✅
      └─ NO → Wrong category

Does the event name start with "virtual_card."?
  ├─ YES → Correct category! ✅
  └─ NO → Wrong category, find "Virtual Cards" section
```

---

## 🆘 If You Can't Find Virtual Cards Category

### Option 1: Contact VFD Support
```
Email: support@vfdtech.ng
Subject: Enable Virtual Cards Webhook

Body:
Hi VFD Team,

Please enable Virtual Cards webhook category for my account.

Account ID: [Your VFD Account ID]
Business Name: Ovomonie
Webhook URL: https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards

Events needed:
- virtual_card.created
- virtual_card.activated
- virtual_card.failed
- virtual_card.blocked

Thank you!
```

### Option 2: Use API Registration
```bash
# Use the script we created
node scripts/register-vfd-webhook.js https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards YOUR_VFD_TOKEN
```

### Option 3: Account Manager
- Contact your VFD account manager
- Request Virtual Cards webhook access
- Provide webhook URL and events

---

## ✅ Verification Checklist

After configuring in portal:

- [ ] Category selected: "Virtual Cards" (not Debit Card Outflow)
- [ ] Webhook URL: `https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards`
- [ ] Events selected: All virtual_card.* events
- [ ] Secret key added: Your VFD_WEBHOOK_SECRET
- [ ] Status: Active
- [ ] Test webhook: Passed
- [ ] Webhook appears in "Active Webhooks" list

---

## 🎉 Summary

**CORRECT:**
- ✅ Category: **Virtual Cards** (or Card Issuance/BaaS Cards)
- ✅ Events: `virtual_card.*`
- ✅ URL: `https://ovomonie-v1.vercel.app/api/webhooks/vfd-cards`

**WRONG:**
- ❌ Category: Debit Card Outflow
- ❌ Category: Wallet Outflow
- ❌ Category: Payment Outflow

**Why?**
Virtual cards and physical debit cards are different products with different webhook events!

---

## 📞 Need Help?

If you can't find the right category:
1. Take a screenshot of available webhook categories
2. Contact VFD support
3. Or use API registration script as fallback

**Your webhook endpoint is ready - just needs to be registered in the correct category!** ✅
