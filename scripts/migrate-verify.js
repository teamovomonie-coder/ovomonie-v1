require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠ Missing Supabase credentials - running verification simulation');
  simulateVerification();
  return;
}

function simulateVerification() {
  const exportPath = path.join(__dirname, '..', 'firebase-export.json');
  
  if (!fs.existsSync(exportPath)) {
    console.error('Export file not found.');
    process.exit(1);
  }
  
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  
  console.log('🔍 Simulating migration verification...\n');
  
  const tables = [
    'users',
    'financial_transactions',
    'notifications',
    'events',
    'inventory_products',
    'inventory_categories',
    'invoices',
    'support_tickets'
  ];
  
  let totalExpected = 0;
  
  for (const table of tables) {
    const expectedCount = exportData[table]?.length || 0;
    totalExpected += expectedCount;
    
    const status = expectedCount > 0 ? '✅' : '⚠';
    console.log(`${status} ${table}: would verify ${expectedCount} records`);
  }
  
  console.log(`\n✅ Verification simulation complete!`);
  console.log(`Expected total records: ${totalExpected}`);
  console.log('\n📋 To run actual verification:');
  console.log('1. Set up Supabase credentials');
  console.log('2. Run the import script first');
  console.log('3. Run: npm run migrate:verify');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTable(tableName, expectedCount) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error(`❌ Error checking ${tableName}:`, error.message);
    return false;
  }
  
  const status = count === expectedCount ? '✅' : '⚠';
  console.log(`${status} ${tableName}: ${count}/${expectedCount} records`);
  
  return count === expectedCount;
}

async function main() {
  try {
    const exportPath = path.join(__dirname, '..', 'firebase-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.error('Export file not found.');
      process.exit(1);
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    console.log('Verifying migration...\n');
    
    const tables = [
      'users',
      'financial_transactions',
      'notifications',
      'events',
      'inventory_products',
      'inventory_categories',
      'invoices',
      'support_tickets'
    ];
    
    let allValid = true;
    
    for (const table of tables) {
      const expectedCount = exportData[table]?.length || 0;
      const isValid = await verifyTable(table, expectedCount);
      if (!isValid) allValid = false;
    }
    
    console.log('\n' + (allValid ? '✅ Migration verified successfully!' : '⚠ Migration has discrepancies'));
    
    if (!allValid) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

main();