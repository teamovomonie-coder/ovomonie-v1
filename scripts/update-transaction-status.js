#!/usr/bin/env node

/**
 * Update Transaction Status Script
 * Usage: node scripts/update-transaction-status.js <transaction-id-or-reference> <status>
 * Status options: pending, processing, completed, failed
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

async function updateTransactionStatus(idOrReference, newStatus) {
  const validStatuses = ['pending', 'processing', 'completed', 'failed'];
  
  if (!validStatuses.includes(newStatus)) {
    console.error(`❌ Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔍 Finding transaction: ${idOrReference}\n`);

  // Try by ID first
  let { data: existing, error } = await supabase
    .from('pending_transactions')
    .select('*')
    .eq('id', idOrReference)
    .single();

  // If not found, try by reference
  if (error || !existing) {
    const result = await supabase
      .from('pending_transactions')
      .select('*')
      .eq('reference', idOrReference)
      .single();
    
    existing = result.data;
    error = result.error;
  }

  if (error || !existing) {
    console.error('❌ Transaction not found');
    process.exit(1);
  }

  console.log(`📝 Current status: ${existing.status}`);
  console.log(`🔄 Updating to: ${newStatus}\n`);

  const updates = { status: newStatus };
  if (newStatus === 'completed' || newStatus === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error: updateError } = await supabase
    .from('pending_transactions')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single();

  if (updateError || !data) {
    console.error('❌ Failed to update transaction:', updateError);
    process.exit(1);
  }

  console.log('✅ Transaction updated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:              ${data.id}`);
  console.log(`Reference:       ${data.reference}`);
  console.log(`Status:          ${data.status}`);
  console.log(`Completed:       ${data.completed_at ? new Date(data.completed_at).toLocaleString() : 'Not completed'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

const [idOrReference, newStatus] = process.argv.slice(2);

if (!idOrReference || !newStatus) {
  console.error('Usage: node scripts/update-transaction-status.js <transaction-id-or-reference> <status>');
  console.error('Status options: pending, processing, completed, failed');
  process.exit(1);
}

updateTransactionStatus(idOrReference, newStatus).catch(console.error);
