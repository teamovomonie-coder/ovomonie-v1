#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findUser(phone) {
  const phoneClean = String(phone || '').replace(/\D/g, '');
  console.log('Searching for phone:', phone, 'clean:', phoneClean);

  const tryQuery = async (col, val) => {
    const { data, error } = await supabase.from('users').select('*').eq(col, val).limit(1).maybeSingle();
    if (error) {
      // ignore
      return null;
    }
    return data || null;
  };

  let user = await tryQuery('phone', phone) || await tryQuery('phone', phoneClean) || await tryQuery('phone_number', phone) || await tryQuery('phone_number', phoneClean);
  if (!user && phoneClean) {
    const { data } = await supabase.from('users').select('*').ilike('phone', `%${phoneClean.slice(-7)}%`).limit(5);
    if (data && data.length) user = data[0];
  }

  if (!user) {
    console.log('User not found');
    return;
  }

  // mask sensitive fields
  const masked = Object.assign({}, user, {
    login_pin_hash: user.login_pin_hash ? '[REDACTED]' : null,
    transaction_pin_hash: user.transaction_pin_hash ? '[REDACTED]' : null,
  });

  console.log('Found user:', JSON.stringify(masked, null, 2));
}

const phoneArg = process.argv[2];
if (!phoneArg) {
  console.error('Usage: node scripts/debug-user.js <phone>');
  process.exit(1);
}

findUser(phoneArg).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(2); });
