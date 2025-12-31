#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying schema fixes migration...\n');
  
  const sql = fs.readFileSync('database/migrations/0004_fix_schema_issues.sql', 'utf8');
  
  try {
    const { error } = await db.rpc('exec_sql', { sql });
    if (error) throw error;
    console.log('✅ Schema fixes applied successfully!\n');
  } catch (e) {
    console.log('⚠️  Could not execute via API. Run this SQL manually in Supabase dashboard:\n');
    console.log(sql);
    console.log('\nGo to: https://supabase.com/dashboard/project/[your-project-id]/editor\n');
    return false;
  }
  
  return true;
}

async function addForeignKeys() {
  console.log('🔗 Adding foreign key constraints...\n');
  
  const foreignKeys = `
-- Add foreign key constraints after users table is finalized
ALTER TABLE IF EXISTS inventory_transactions 
  ADD CONSTRAINT fk_inventory_transactions_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS savings_goals 
  ADD CONSTRAINT fk_savings_goals_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS budgets 
  ADD CONSTRAINT fk_budgets_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS crypto_assets 
  ADD CONSTRAINT fk_crypto_assets_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS insurance 
  ADD CONSTRAINT fk_insurance_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS referrals 
  ADD CONSTRAINT fk_referrals_referrer_id 
  FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_referrals_referee_id 
  FOREIGN KEY (referee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS loyalty_points 
  ADD CONSTRAINT fk_loyalty_points_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
`;

  try {
    const { error } = await db.rpc('exec_sql', { sql: foreignKeys });
    if (error) throw error;
    console.log('✅ Foreign key constraints added successfully!\n');
  } catch (e) {
    console.log('⚠️  Could not add foreign keys via API. Run this SQL manually:\n');
    console.log(foreignKeys);
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🚀 Starting schema fixes and foreign key setup...\n');
  
  const migrationSuccess = await applyMigration();
  if (!migrationSuccess) {
    console.log('❌ Migration failed. Please apply manually before adding foreign keys.');
    return;
  }
  
  const fkSuccess = await addForeignKeys();
  if (!fkSuccess) {
    console.log('❌ Foreign key setup failed. Please add manually.');
    return;
  }
  
  console.log('🎉 All schema fixes and foreign keys applied successfully!');
}

main().catch(console.error);