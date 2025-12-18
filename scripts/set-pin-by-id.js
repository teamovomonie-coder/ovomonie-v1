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

async function setPinById(userId, pin) {
  const hashed = hashSecret(pin);
  const { error } = await supabase.from('users').update({ login_pin_hash: hashed }).eq('id', userId);
  if (error) {
    console.error('Failed to update user pin:', error.message || error);
    process.exit(2);
  }
  console.log(`Updated login PIN for user ${userId}`);
}

const [,, userId, pin] = process.argv;
if (!userId || !pin) {
  console.error('Usage: node scripts/set-pin-by-id.js <userId> <pin>');
  process.exit(1);
}

setPinById(userId, pin).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(3); });
