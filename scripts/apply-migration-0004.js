#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    const { data, error } = await db.rpc('exec_sql', { sql });
    if (error) throw error;
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.log(`⚠️  RPC failed, trying direct query for: ${description}`);
    try {
      const { data, error: directError } = await db.from('_temp').select('1').limit(0);
      // This is just to test connection, actual SQL execution needs manual intervention
      console.log(`❌ Could not execute via API. Please run this SQL manually in Supabase dashboard:`);
      console.log(`-- ${description}`);
      console.log(sql);
      console.log('');
      return false;
    } catch (e) {
      console.log(`❌ Failed to execute: ${description}`);
      console.log(`Error: ${error.message}`);
      return false;
    }
  }
}

async function applyMigration() {
  console.log('\n🚀 Applying Migration: 0004_fix_schema_issues.sql\n');
  
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '0004_fix_schema_issues.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== 'End migration');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    const description = extractDescription(statement);
    const success = await executeSQL(statement + ';', description);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`❌ Failed operations: ${failureCount}`);
  
  if (failureCount > 0) {
    console.log(`\n⚠️  Some operations failed. Please run the failed SQL statements manually in Supabase dashboard.`);
    console.log(`Dashboard URL: https://supabase.com/dashboard/project/${extractProjectId(supabaseUrl)}/editor`);
  }
}

async function addForeignKeyConstraints() {
  console.log('\n🔗 Adding Foreign Key Constraints\n');
  
  const foreignKeyConstraints = [
    {
      description: 'Add foreign key: inventory_transactions.user_id -> users.id',
      sql: `
        ALTER TABLE inventory_transactions 
        ADD CONSTRAINT fk_inventory_transactions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: savings_goals.user_id -> users.id',
      sql: `
        ALTER TABLE savings_goals 
        ADD CONSTRAINT fk_savings_goals_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: budgets.user_id -> users.id',
      sql: `
        ALTER TABLE budgets 
        ADD CONSTRAINT fk_budgets_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: crypto_assets.user_id -> users.id',
      sql: `
        ALTER TABLE crypto_assets 
        ADD CONSTRAINT fk_crypto_assets_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: insurance.user_id -> users.id',
      sql: `
        ALTER TABLE insurance 
        ADD CONSTRAINT fk_insurance_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: referrals.referrer_id -> users.id',
      sql: `
        ALTER TABLE referrals 
        ADD CONSTRAINT fk_referrals_referrer_id 
        FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: referrals.referee_id -> users.id',
      sql: `
        ALTER TABLE referrals 
        ADD CONSTRAINT fk_referrals_referee_id 
        FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: loyalty_points.user_id -> users.id',
      sql: `
        ALTER TABLE loyalty_points 
        ADD CONSTRAINT fk_loyalty_points_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: notifications.user_id -> users.id',
      sql: `
        ALTER TABLE notifications 
        ADD CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      description: 'Add foreign key: transactions.user_id -> users.id',
      sql: `
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `
    }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const constraint of foreignKeyConstraints) {
    const success = await executeSQL(constraint.sql, constraint.description);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log(`\n📊 Foreign Key Constraints Summary:`);
  console.log(`✅ Successful constraints: ${successCount}`);
  console.log(`❌ Failed constraints: ${failureCount}`);
}

function extractDescription(sql) {
  if (sql.includes('ALTER TABLE') && sql.includes('ALTER COLUMN')) {
    const match = sql.match(/ALTER TABLE\s+(\w+)/i);
    if (match) {
      return `Fix data types for table: ${match[1]}`;
    }
  }
  
  if (sql.includes('ADD CONSTRAINT')) {
    const match = sql.match(/ADD CONSTRAINT\s+(\w+)/i);
    if (match) {
      return `Add constraint: ${match[1]}`;
    }
  }
  
  if (sql.includes('ENABLE ROW LEVEL SECURITY')) {
    const match = sql.match(/ALTER TABLE\s+(\w+)/i);
    if (match) {
      return `Enable RLS for table: ${match[1]}`;
    }
  }
  
  return 'Execute SQL statement';
}

function extractProjectId(url) {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'your-project-id';
}

async function main() {
  console.log('🎯 Ovomonie Database Migration & Foreign Key Setup');
  console.log('==================================================\n');
  
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await db.from('users').select('id').limit(1);
    if (error && !error.message.includes('relation "users" does not exist')) {
      throw error;
    }
    console.log('✅ Database connection successful\n');
    
    // Apply migration
    await applyMigration();
    
    // Add foreign key constraints
    await addForeignKeyConstraints();
    
    console.log('\n🎉 Migration and foreign key setup completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Verify all tables exist and have correct structure');
    console.log('2. Test application functionality');
    console.log('3. Run data validation queries');
    console.log('4. Update application code if needed');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();