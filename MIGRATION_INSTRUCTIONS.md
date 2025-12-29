# Apply Database Migration

Since Supabase CLI is not installed, apply this migration manually:

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250126000000_atomic_transfers.sql`
4. Click **Run** to execute the migration

## Option 2: Via Node.js Script

Run this command:
```bash
node scripts/apply-migration.js
```

## Option 3: Install Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Verify Migration

After applying, verify the function exists:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'process_internal_transfer';
```

Should return one row with the function name.
