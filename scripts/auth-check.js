#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { scryptSync, timingSafeEqual, createHmac } = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE config in .env.local');
  process.exit(1);
}
if (!AUTH_SECRET) {
  console.error('Missing AUTH_SECRET in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findUser(phone) {
  const phoneClean = String(phone || '').replace(/\D/g, '');
  const tryQuery = async (col, val) => {
    const { data } = await supabase.from('users').select('*').eq(col, val).limit(1).maybeSingle();
    return data || null;
  };
  let user = await tryQuery('phone', phone) || await tryQuery('phone', phoneClean) || await tryQuery('phone_number', phone) || await tryQuery('phone_number', phoneClean);
  if (!user && phoneClean) {
    const { data } = await supabase.from('users').select('*').ilike('phone', `%${phoneClean.slice(-7)}%`).limit(5);
    if (data && data.length) user = data[0];
  }
  return user;
}

function verifySecret(secret, storedHash) {
  if (!storedHash) return false;
  const [saltB64, hashB64] = storedHash.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const stored = Buffer.from(hashB64, 'base64');
  const derived = scryptSync(String(secret), salt, stored.length);
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

function createAuthToken(userId, ttlSeconds = 60*60*24) {
  const iat = Math.floor(Date.now()/1000);
  const payload = { sub: userId, iat, exp: iat + ttlSeconds };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
  return `ovotoken.${payloadB64}.${sig}`;
}

const [,, phone, pin] = process.argv;
if (!phone || !pin) { console.error('Usage: node scripts/auth-check.js <phone> <pin>'); process.exit(1); }

(async ()=>{
  const user = await findUser(phone);
  if (!user) { console.error('User not found'); process.exit(2); }
  const ok = verifySecret(pin, user.login_pin_hash || '');
  console.log('userId:', user.id, 'hasPin:', !!user.login_pin_hash, 'verify:', ok);
  if (ok) {
    const token = createAuthToken(user.id);
    console.log('AUTH_TOKEN:', token);
  }
})();
