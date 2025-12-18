#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotifications(reference) {
  console.log(`\n🔔 Checking notifications for reference: ${reference}\n`);

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('reference', reference)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No notifications found for this reference');
    return;
  }

  console.log(`✅ Found ${data.length} notification(s):\n`);
  data.forEach((notif, i) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Notification ${i + 1}:`);
    console.log(`  User ID:    ${notif.user_id}`);
    console.log(`  Title:      ${notif.title}`);
    console.log(`  Body:       ${notif.body}`);
    console.log(`  Type:       ${notif.type}`);
    console.log(`  Category:   ${notif.category}`);
    console.log(`  Amount:     ₦${(notif.amount / 100).toLocaleString()}`);
    console.log(`  Read:       ${notif.is_read ? 'Yes' : 'No'}`);
    console.log(`  Created:    ${new Date(notif.created_at).toLocaleString()}`);
  });
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

const reference = process.argv[2];
if (!reference) {
  console.error('Usage: node scripts/check-notifications.js <reference>');
  process.exit(1);
}

checkNotifications(reference).catch(console.error);
