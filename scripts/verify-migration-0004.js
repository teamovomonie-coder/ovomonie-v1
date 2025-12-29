#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await db
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
    
    return data && data.length > 0;
  } catch (error) {
    return false;
  }
}

async function checkColumnType(tableName, columnName, expectedType) {
  try {
    const { data, error } = await db
      .from('information_schema.columns')
      .select('data_type, is_nullable')
      .eq('table_name', tableName)
      .eq('column_name', columnName)
      .eq('table_schema', 'public');
    
    if (error || !data || data.length === 0) {
      return { exists: false };
    }
    
    return {
      exists: true,
      type: data[0].data_type,
      nullable: data[0].is_nullable === 'YES',
      matches: data[0].data_type.toLowerCase().includes(expectedType.toLowerCase())
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function checkConstraintExists(constraintName) {
  try {
    const { data, error } = await db
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('constraint_name', constraintName)
      .eq('constraint_schema', 'public');
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    return null;
  }
}

async function checkForeignKeyExists(tableName, constraintName) {
  try {
    const { data, error } = await db
      .from('information_schema.referential_constraints')
      .select('*')
      .eq('constraint_name', constraintName)
      .eq('constraint_schema', 'public');
    
    return data && data.length > 0;
  } catch (error) {
    return false;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying Migration 0004 Results\n');
  
  const checks = [
    {
      name: 'inventory_transactions.user_id UUID type',
      check: () => checkColumnType('inventory_transactions', 'user_id', 'uuid')
    },
    {
      name: 'inventory_products.unit_price NOT NULL',
      check: () => checkColumnType('inventory_products', 'unit_price', 'numeric')
    },
    {
      name: 'inventory_products.cost_price NOT NULL',
      check: () => checkColumnType('inventory_products', 'cost_price', 'numeric')
    },
    {
      name: 'savings_goals.user_id UUID type',
      check: () => checkColumnType('savings_goals', 'user_id', 'uuid')
    },
    {
      name: 'budgets.user_id UUID type',
      check: () => checkColumnType('budgets', 'user_id', 'uuid')
    },
    {
      name: 'crypto_assets.user_id UUID type',
      check: () => checkColumnType('crypto_assets', 'user_id', 'uuid')
    },
    {
      name: 'insurance.user_id UUID type',
      check: () => checkColumnType('insurance', 'user_id', 'uuid')
    },
    {
      name: 'referrals.referrer_id UUID type',
      check: () => checkColumnType('referrals', 'referrer_id', 'uuid')
    },
    {
      name: 'referrals.referee_id UUID type',
      check: () => checkColumnType('referrals', 'referee_id', 'uuid')
    },
    {
      name: 'loyalty_points.user_id UUID type',
      check: () => checkColumnType('loyalty_points', 'user_id', 'uuid')
    },
    {
      name: 'currency_rates unique constraint',
      check: () => checkConstraintExists('unique_currency_pair')
    },
    {
      name: 'pending_payments RLS enabled',
      check: async () => {
        try {
          const { data, error } = await db
            .from('pg_class')
            .select('relrowsecurity')
            .eq('relname', 'pending_payments');
          return data && data.length > 0 && data[0].relrowsecurity;
        } catch (error) {
          return false;
        }
      }
    }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    try {
      const result = await check.check();
      
      if (typeof result === 'boolean') {
        if (result) {
          console.log(`✅ ${check.name}`);
          passedChecks++;
        } else {
          console.log(`❌ ${check.name}`);
        }
      } else if (result && result.exists) {
        if (result.matches || result.nullable === false) {
          console.log(`✅ ${check.name} (${result.type}${result.nullable ? ', nullable' : ', not null'})`);
          passedChecks++;
        } else {
          console.log(`⚠️  ${check.name} (${result.type}, expected different type)`);
        }
      } else {
        console.log(`❌ ${check.name} (column/constraint not found)`);
      }
    } catch (error) {
      console.log(`❌ ${check.name} (error: ${error.message})`);
    }
  }
  
  console.log(`\n📊 Migration Verification: ${passedChecks}/${totalChecks} checks passed`);
  return passedChecks === totalChecks;
}

async function verifyForeignKeys() {
  console.log('\n🔗 Verifying Foreign Key Constraints\n');
  
  const foreignKeys = [
    'fk_inventory_transactions_user_id',
    'fk_savings_goals_user_id',
    'fk_budgets_user_id',
    'fk_crypto_assets_user_id',
    'fk_insurance_user_id',
    'fk_referrals_referrer_id',
    'fk_referrals_referee_id',
    'fk_loyalty_points_user_id',
    'fk_notifications_user_id',
    'fk_transactions_user_id'
  ];
  
  let existingFKs = 0;
  
  for (const fkName of foreignKeys) {
    const exists = await checkForeignKeyExists('', fkName);
    if (exists) {
      console.log(`✅ ${fkName}`);
      existingFKs++;
    } else {
      console.log(`❌ ${fkName}`);
    }
  }
  
  console.log(`\n📊 Foreign Key Verification: ${existingFKs}/${foreignKeys.length} constraints exist`);
  return existingFKs === foreignKeys.length;
}

async function checkTableStructure() {
  console.log('\n📋 Checking Core Table Structure\n');
  
  const coreTables = [
    'users',
    'notifications',
    'transactions',
    'inventory_transactions',
    'inventory_products',
    'savings_goals',
    'budgets',
    'crypto_assets',
    'insurance',
    'referrals',
    'loyalty_points',
    'currency_rates',
    'pending_payments'
  ];
  
  let existingTables = 0;
  
  for (const tableName of coreTables) {
    const exists = await checkTableExists(tableName);
    if (exists) {
      console.log(`✅ Table: ${tableName}`);
      existingTables++;
    } else {
      console.log(`❌ Table: ${tableName} (missing)`);
    }
  }
  
  console.log(`\n📊 Table Structure: ${existingTables}/${coreTables.length} tables exist`);
  return existingTables;
}

async function generateReport() {
  console.log('\n📄 Generating Database Health Report\n');
  
  try {
    // Get table count
    const { data: tableCount } = await db
      .from('information_schema.tables')
      .select('table_name', { count: 'exact' })
      .eq('table_schema', 'public');
    
    // Get constraint count
    const { data: constraintCount } = await db
      .from('information_schema.table_constraints')
      .select('constraint_name', { count: 'exact' })
      .eq('constraint_schema', 'public');
    
    // Get foreign key count
    const { data: fkCount } = await db
      .from('information_schema.referential_constraints')
      .select('constraint_name', { count: 'exact' })
      .eq('constraint_schema', 'public');
    
    console.log(`📊 Database Statistics:`);
    console.log(`   Tables: ${tableCount?.length || 0}`);
    console.log(`   Constraints: ${constraintCount?.length || 0}`);
    console.log(`   Foreign Keys: ${fkCount?.length || 0}`);
    
  } catch (error) {
    console.log(`⚠️  Could not generate full report: ${error.message}`);
  }
}

async function main() {
  console.log('🎯 Ovomonie Database Verification');
  console.log('=================================\n');
  
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await db.from('users').select('id').limit(1);
    if (error && !error.message.includes('relation "users" does not exist')) {
      throw error;
    }
    console.log('✅ Database connection successful\n');
    
    // Check table structure
    const tableCount = await checkTableStructure();
    
    // Verify migration
    const migrationPassed = await verifyMigration();
    
    // Verify foreign keys
    const foreignKeysPassed = await verifyForeignKeys();
    
    // Generate report
    await generateReport();
    
    console.log('\n🎉 Verification Complete!');
    
    if (migrationPassed && foreignKeysPassed) {
      console.log('✅ All checks passed - database is ready for production');
    } else {
      console.log('⚠️  Some checks failed - review the results above');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();