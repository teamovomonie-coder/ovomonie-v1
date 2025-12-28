# Running Database Migrations

## Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the content from `supabase/migrations/20250127000000_create_invoices.sql`
4. Paste and run the SQL

## Option 2: Supabase CLI
```bash
npx supabase db push
```

## Verify Migration
After running the migration, verify the `invoices` table exists:
```sql
SELECT * FROM invoices LIMIT 1;
```
