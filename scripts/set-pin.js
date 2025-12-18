#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { randomBytes, scryptSync } = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashSecret(secret) {
  const salt = randomBytes(16);
  const derived = scryptSync(String(secret), salt, 64);
  return `${salt.toString('base64')}:${derived.toString('base64')}`;
}

async function setPin(phone, pin) {
  const phoneClean = String(phone || '').replace(/\D/g, '');
  // try to find user
  const { data: user, error } = await supabase.from('users').select('*').or(`phone.eq.${phone},phone.eq.${phoneClean},phone_number.eq.${phone},phone_number.eq.${phoneClean}`).limit(1).maybeSingle();
  if (error) {
    console.error('Error finding user:', error.message || error);
    process.exit(2);
  }
  if (!user) {
    console.error('User not found for phone', phone);
    process.exit(3);
  }

  const hashed = hashSecret(pin);
  const { error: updErr } = await supabase.from('users').update({ login_pin_hash: hashed }).eq('id', user.id);
  if (updErr) {
    console.error('Failed to update user pin:', updErr.message || updErr);
    process.exit(4);
  }

  console.log(`Updated login PIN for user ${user.id} (phone: ${phone}).`);
}

const [,, phoneArg, pinArg] = process.argv;
if (!phoneArg || !pinArg) {
  console.error('Usage: node scripts/set-pin.js <phone> <pin>');
  process.exit(1);
}

setPin(phoneArg, pinArg).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(5); });
