require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠ Missing Supabase credentials - running in simulation mode');
  simulateImport();
  return;
}

function simulateImport() {
  const exportPath = path.join(__dirname, '..', 'firebase-export.json');
  
  if (!fs.existsSync(exportPath)) {
    console.error('Export file not found. Run migrate:export-firebase first.');
    process.exit(1);
  }
  
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  
  console.log('🔄 Simulating Supabase import...\n');
  
  const collectionMapping = {
    'users': 'users',
    'financial_transactions': 'financial_transactions',
    'notifications': 'notifications',
    'events': 'events',
    'inventory_products': 'inventory_products',
    'inventory_categories': 'inventory_categories',
    'invoices': 'invoices',
    'support_tickets': 'support_tickets'
  };
  
  let totalRecords = 0;
  
  for (const [firebaseCollection, supabaseTable] of Object.entries(collectionMapping)) {
    if (exportData[firebaseCollection] && exportData[firebaseCollection].length > 0) {
      const count = exportData[firebaseCollection].length;
      console.log(`✓ Would import ${count} records to ${supabaseTable}`);
      totalRecords += count;
    } else {
      console.log(`⚠ No data to import for ${supabaseTable}`);
    }
  }
  
  console.log(`\n✅ Simulation complete! Would import ${totalRecords} total records`);
  console.log('\n📋 To run actual import:');
  console.log('1. Set NEXT_PUBLIC_SUPABASE_URL in your environment');
  console.log('2. Set SUPABASE_SERVICE_ROLE_KEY in your environment');
  console.log('3. Run: npm run migrate:import-supabase');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCollection(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⚠ No data to import for ${tableName}`);
    return;
  }
  
  console.log(`Importing ${data.length} records to ${tableName}...`);
  
  // Import in batches of 100
  const batchSize = 100;
  let imported = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error importing batch to ${tableName}:`, error);
      throw error;
    }
    
    imported += batch.length;
    console.log(`  Imported ${imported}/${data.length} records`);
  }
  
  console.log(`✓ Successfully imported ${imported} records to ${tableName}`);
}

async function main() {
  try {
    const exportPath = path.join(__dirname, '..', 'firebase-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.error('Export file not found. Run migrate:export-firebase first.');
      process.exit(1);
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    // Map Firebase collections to Supabase tables
    const collectionMapping = {
      'users': 'users',
      'financial_transactions': 'financial_transactions',
      'notifications': 'notifications',
      'events': 'events',
      'inventory_products': 'inventory_products',
      'inventory_categories': 'inventory_categories',
      'invoices': 'invoices',
      'support_tickets': 'support_tickets'
    };
    
    console.log('Starting Supabase import...\n');
    
    for (const [firebaseCollection, supabaseTable] of Object.entries(collectionMapping)) {
      if (exportData[firebaseCollection]) {
        await       }
    }
    
    console.log('\n✅ Import complete!');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();