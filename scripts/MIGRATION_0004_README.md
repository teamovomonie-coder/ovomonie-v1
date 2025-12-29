# Database Migration 0004 - Schema Fixes & Foreign Keys

This directory contains scripts to apply migration 0004 and add foreign key constraints to finalize the Ovomonie database schema.

## Files Created

- `apply-migration-0004.js` - Applies the 0004 migration and adds foreign key constraints
- `verify-migration-0004.js` - Verifies the migration was applied correctly
- `run-complete-migration.js` - Runs both scripts in sequence

## Prerequisites

1. Ensure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

## Usage

### Option 1: Run Complete Pipeline (Recommended)
```bash
cd scripts
node run-complete-migration.js
```

### Option 2: Run Individual Scripts
```bash
# Apply migration and foreign keys
node apply-migration-0004.js

# Verify results
node verify-migration-0004.js
```

## What This Migration Does

### Schema Fixes (from 0004_fix_schema_issues.sql)
1. **Data Type Standardization**: Converts user_id columns to UUID type
2. **NOT NULL Constraints**: Adds required constraints to inventory_products
3. **Unique Constraints**: Adds unique constraint for currency_rates
4. **Row Level Security**: Enables RLS on pending_payments table

### Foreign Key Constraints Added
- `inventory_transactions.user_id` → `users.id`
- `savings_goals.user_id` → `users.id`
- `budgets.user_id` → `users.id`
- `crypto_assets.user_id` → `users.id`
- `insurance.user_id` → `users.id`
- `referrals.referrer_id` → `users.id`
- `referrals.referee_id` → `users.id`
- `loyalty_points.user_id` → `users.id`
- `notifications.user_id` → `users.id`
- `transactions.user_id` → `users.id`

## Verification Checks

The verification script checks:
- ✅ All tables exist
- ✅ Column data types are correct
- ✅ NOT NULL constraints are applied
- ✅ Unique constraints exist
- ✅ Foreign key constraints are in place
- ✅ Row Level Security is enabled where needed

## Troubleshooting

### If API Execution Fails
Some operations may need to be run manually in the Supabase dashboard:
1. Go to: https://supabase.com/dashboard/project/[your-project-id]/editor
2. Copy the SQL statements from the script output
3. Execute them manually in the SQL editor

### Common Issues
1. **Missing Tables**: Ensure previous migrations have been run
2. **Permission Errors**: Verify your service role key has admin permissions
3. **Data Type Conflicts**: Check for existing data that conflicts with new constraints

## Next Steps After Migration

1. **Test Application**: Ensure all features work with the new schema
2. **Update Code**: Modify any code that relies on the old schema
3. **Performance Testing**: Run queries to ensure foreign keys don't impact performance
4. **Backup**: Create a backup of your database after successful migration

## Rollback Plan

If you need to rollback:
1. Drop the foreign key constraints first
2. Revert column type changes
3. Remove unique constraints
4. Disable RLS if needed

Example rollback SQL:
```sql
-- Drop foreign keys
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS fk_inventory_transactions_user_id;
-- ... repeat for other constraints

-- Revert data types (if needed)
ALTER TABLE inventory_transactions ALTER COLUMN user_id TYPE TEXT;
-- ... repeat for other tables
```

## Support

If you encounter issues:
1. Check the script output for specific error messages
2. Verify your Supabase credentials and permissions
3. Ensure all prerequisite tables exist
4. Contact the development team for assistance