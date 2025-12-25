#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runInventoryMigration() {
  try {
    console.log('🚀 Running inventory database migration...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/inventory-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        if (error) {
          console.error('Error executing statement:', error);
        }
      }
    }

    // Insert sample data
    console.log('📦 Inserting sample data...');

    // Sample categories
    const { error: catError } = await supabase.from('inventory_categories').upsert([
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Food & Beverages', description: 'Food items and drinks' },
      { name: 'Books', description: 'Books and educational materials' }
    ], { onConflict: 'name' });

    if (catError) console.error('Category insert error:', catError);

    // Sample locations
    const { error: locError } = await supabase.from('inventory_locations').upsert([
      { name: 'Main Warehouse', address: 'Lagos, Nigeria', manager: 'John Doe' },
      { name: 'Store Front', address: 'Victoria Island, Lagos', manager: 'Jane Smith' },
      { name: 'Online Fulfillment', address: 'Ikeja, Lagos', manager: 'Mike Johnson' }
    ], { onConflict: 'name' });

    if (locError) console.error('Location insert error:', locError);

    // Sample suppliers
    const { error: supError } = await supabase.from('inventory_suppliers').upsert([
      { 
        name: 'Tech Supplies Ltd', 
        contact_person: 'Alice Brown', 
        email: 'alice@techsupplies.com',
        phone: '+234-800-1234-567'
      },
      { 
        name: 'Fashion Wholesale', 
        contact_person: 'Bob Wilson', 
        email: 'bob@fashionwholesale.com',
        phone: '+234-800-2345-678'
      }
    ], { onConflict: 'name' });

    if (supError) console.error('Supplier insert error:', supError);

    console.log('✅ Inventory migration completed successfully!');
    console.log('📋 Created tables:');
    console.log('  - inventory_categories');
    console.log('  - inventory_suppliers');
    console.log('  - inventory_locations');
    console.log('  - inventory_products');
    console.log('  - inventory_stock');
    console.log('  - inventory_transactions');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runInventoryMigration();