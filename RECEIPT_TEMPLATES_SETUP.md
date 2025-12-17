# Receipt Templates Setup Guide

## Overview
Dynamic receipt template system that generates unique receipts for different bill payment categories (Utility, Cable TV, Internet, Betting, Water, etc.) by fetching templates from Supabase.

## Database Setup

### 1. Run Migration
Execute the SQL migration in Supabase dashboard:
```bash
# File: supabase/migrations/create_receipt_templates.sql
```

Or run directly in Supabase SQL Editor:
- Go to Supabase Dashboard → SQL Editor
- Copy contents of `supabase/migrations/create_receipt_templates.sql`
- Execute the query

### 2. Verify Table Creation
Check that `receipt_templates` table exists with these columns:
- `id` (TEXT, PRIMARY KEY)
- `category` (TEXT, UNIQUE)
- `template_name` (TEXT)
- `fields` (TEXT[])
- `color_scheme` (JSONB)
- `icon` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. Default Templates
The migration automatically inserts 6 default templates:

| Category | Color | Icon | Template Name |
|----------|-------|------|---------------|
| utility | Orange (#f59e0b) | ⚡ zap | Utility Bill Receipt |
| cable tv | Purple (#8b5cf6) | 📺 tv | Cable TV Receipt |
| internet subscription | Cyan (#06b6d4) | 📶 wifi | Internet Subscription Receipt |
| betting | Green (#10b981) | 🏆 trophy | Betting Wallet Receipt |
| water | Blue (#3b82f6) | 💧 droplet | Water Bill Receipt |
| generic | Indigo (#6366f1) | 🧾 receipt | Bill Payment Receipt |

## Architecture

### Files Created
1. **`src/lib/receipt-templates.ts`** - Template service that fetches from Supabase
2. **`src/components/bill-payment/receipt-templates.tsx`** - Category-specific receipt components
3. **`src/components/bill-payment/dynamic-receipt.tsx`** - Dynamic receipt renderer
4. **`supabase/migrations/create_receipt_templates.sql`** - Database migration

### Files Modified
1. **`src/app/api/bills/vfd/route.ts`** - Uses template service to generate receipts
2. **`src/components/bill-payment/vfd-bill-payment.tsx`** - Displays dynamic receipts

## How It Works

### Flow
1. User completes bill payment
2. API calls `receiptTemplateService.createReceipt(category, data)`
3. Service fetches template from Supabase based on category
4. Receipt data + template returned to frontend
5. `DynamicReceipt` component selects appropriate template component
6. Category-specific receipt rendered with unique styling

### Template Selection Logic
```typescript
const category = receipt.template.category.toLowerCase();

const ReceiptComponent = 
  category === 'utility' ? UtilityReceipt :
  category === 'cable tv' ? CableTVReceipt :
  category === 'internet subscription' ? InternetReceipt :
  category === 'betting' ? BettingReceipt :
  GenericReceipt;
```

## Customization

### Add New Template
```sql
INSERT INTO receipt_templates (id, category, template_name, fields, color_scheme, icon) 
VALUES (
  'airtime-default', 
  'airtime', 
  'Airtime Recharge Receipt',
  ARRAY['phoneNumber', 'network', 'amount'],
  '{"primary": "#ec4899", "secondary": "#f472b6", "accent": "#fce7f3"}'::jsonb,
  'phone'
);
```

### Update Template Colors
```sql
UPDATE receipt_templates 
SET color_scheme = '{"primary": "#ff0000", "secondary": "#ff6666", "accent": "#ffcccc"}'::jsonb
WHERE category = 'utility';
```

### Create Custom Receipt Component
1. Add component in `src/components/bill-payment/receipt-templates.tsx`
2. Update `DynamicReceipt` to include new category
3. Add icon to ICONS mapping if needed

## Features

### Per-Category Styling
- Unique color schemes for each bill type
- Category-specific icons
- Custom field layouts

### Token Display (Utility)
- Shows electricity tokens prominently
- Handles KCT1/KCT2 for AEDC
- Clear instructions for meter entry

### Share Functionality
- All receipts can be shared as images
- Watermarked with Ovomonie branding
- Professional layout for sharing

## Testing

### Test Receipt Generation
```typescript
// In browser console or test file
const receipt = await receiptTemplateService.createReceipt('utility', {
  biller: { id: 'ikedc', name: 'IKEDC' },
  amount: 5000,
  accountId: '1234567890',
  transactionId: 'TXN123',
  completedAt: new Date().toISOString(),
  token: '1234-5678-9012-3456'
});
```

### Verify Template Fetch
```sql
-- Check all templates
SELECT * FROM receipt_templates;

-- Check specific category
SELECT * FROM receipt_templates WHERE category = 'utility';
```

## Troubleshooting

### Templates Not Loading
- Check Supabase connection
- Verify RLS policies allow authenticated reads
- Check browser console for errors
- Service falls back to default templates if DB fails

### Wrong Template Displayed
- Verify category name matches exactly (case-insensitive)
- Check `DynamicReceipt` component mapping
- Falls back to `GenericReceipt` if no match

### Styling Issues
- Verify color_scheme JSONB format
- Check Tailwind classes in template components
- Ensure icon name exists in ICONS mapping

## Future Enhancements
- [ ] Admin UI to manage templates
- [ ] Template versioning
- [ ] A/B testing different designs
- [ ] User-customizable receipt themes
- [ ] Multi-language support
- [ ] PDF export
