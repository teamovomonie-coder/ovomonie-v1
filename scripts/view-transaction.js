#!/usr/bin/env node

/**
 * View Transaction Script
 * Usage: node scripts/view-transaction.js <transaction-id-or-reference>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewTransaction(idOrReference) {
  console.log(`\n🔍 Searching for transaction: ${idOrReference}\n`);

  // Try by ID first
  let { data, error } = await supabase
    .from('pending_transactions')
    .select('*')
    .eq('id', idOrReference)
    .single();

  // If not found, try by reference
  if (error || !data) {
    const result = await supabase
      .from('pending_transactions')
      .select('*')
      .eq('reference', idOrReference)
      .single();
    
    data = result.data;
    error = result.error;
  }

  if (error || !data) {
    console.error('❌ Transaction not found');
    process.exit(1);
  }

  console.log('✅ Transaction Found:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:              ${data.id}`);
  console.log(`User ID:         ${data.user_id}`);
  console.log(`Type:            ${data.type}`);
  console.log(`Status:          ${data.status}`);
  console.log(`Reference:       ${data.reference}`);
  console.log(`Amount:          ₦${(data.amount / 100).toLocaleString()}`);
  console.log(`Recipient:       ${data.recipient_name || 'N/A'}`);
  console.log(`Bank:            ${data.bank_name || 'N/A'}`);
  console.log(`Created:         ${new Date(data.created_at).toLocaleString()}`);
  console.log(`Updated:         ${new Date(data.updated_at).toLocaleString()}`);
  console.log(`Completed:       ${data.completed_at ? new Date(data.completed_at).toLocaleString() : 'Not completed'}`);
  console.log(`Error:           ${data.error_message || 'None'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📦 Transaction Data:\n');
  console.log(JSON.stringify(data.data, null, 2));
  console.log('\n');
}

const idOrReference = process.argv[2];

if (!idOrReference) {
  console.error('Usage: node scripts/view-transaction.js <transaction-id-or-reference>');
  process.exit(1);
}

viewTransaction(idOrReference).catch(console.error);
