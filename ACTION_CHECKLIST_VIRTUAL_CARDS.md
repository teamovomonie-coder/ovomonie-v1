# ✅ Virtual Card Setup - Action Checklist

## Do These 3 Things Now (15 minutes total)

---

## ☐ 1. Apply Database Migration (5 min)

### Quick Steps:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **SQL Editor** → **New Query**
4. Open file: `supabase/migrations/20250126000001_virtual_cards.sql`
5. Copy ALL content (Ctrl+A, Ctrl+C)
6. Paste in SQL Editor (Ctrl+V)
7. Click **Run** (or Ctrl+Enter)
8. Wait for "Success" message

### Verify:
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('card_requests', 'virtual_cards', 'card_transactions');
-- Should return: 3
```

✅ **Done? Check this box and move to step 2**

---

## ☐ 2. Configure VFD (2 min)

### Add to `.env.local`:
```env
VFD_CONSUMER_KEY=your_vfd_consumer_key
VFD_CONSUMER_SECRET=your_vfd_consumer_secret
VFD_WEBHOOK_SECRET=generate_random_64_char_hex
```

### Generate Webhook Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Restart Server:
```bash
npm run dev
```

✅ **Done? Check this box and move to step 3**

---

## ☐ 3. Register Webhook (5 min)

### For Local Testing:

**A. Start ngrok:**
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**B. Get VFD token:**
```bash
node scripts/get-vfd-token.js
```
Copy the token

**C. Register webhook:**
```bash
node scripts/register-vfd-webhook.js https://abc123.ngrok.io/api/webhooks/vfd-cards YOUR_TOKEN
```

### For Production:

**A. Deploy your app first**

**B. Get VFD token:**
```bash
node scripts/get-vfd-token.js
```

**C. Register webhook:**
```bash
node scripts/register-vfd-webhook.js https://your-domain.com/api/webhooks/vfd-cards YOUR_TOKEN
```

✅ **Done? All 3 steps complete!**

---

## 🧪 Test It Works

```bash
# Get your auth token from browser localStorage (key: ovo-auth-token)

curl -X POST http://localhost:3000/api/cards/virtual-new \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardName": "Test Card"}'
```

**Expected:** Card created successfully ✅

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `VIRTUAL_CARD_QUICKSTART.md` | Visual step-by-step guide |
| `VIRTUAL_CARD_SETUP_GUIDE.md` | Detailed setup instructions |
| `VIRTUAL_CARD_IMPLEMENTATION.md` | Complete technical docs |
| `VIRTUAL_CARD_QUICK_REF.md` | API reference |

---

## 🆘 Having Issues?

### Migration Failed
- Check Supabase connection
- Verify you're in correct project
- Try running SQL manually

### VFD Token Failed
- Check credentials in `.env.local`
- Restart dev server
- Verify VFD account is active

### Webhook Failed
- Must use HTTPS (ngrok for local)
- Check webhook URL is accessible
- Token expires in 1 hour - get new one

---

## ✨ You're Ready!

Once all 3 boxes are checked:
- ✅ Database configured
- ✅ VFD integrated  
- ✅ Webhooks active

**Your virtual card system is production-ready!** 🚀

Use `src/hooks/use-virtual-card.ts` in your React components.
