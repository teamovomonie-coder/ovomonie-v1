#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const phone = process.argv[2];
const pin = process.argv[3];
const explicitTarget = process.argv[4];
if (!phone || !pin) {
  console.error('Usage: node scripts/post-login.js <phone> <pin> [targetUrl]');
  process.exit(1);
}
const targetUrl = explicitTarget || process.env.LOGIN_URL || 'http://localhost:3001';
(async () => {
  try {
    const url = new URL('/api/auth/login', targetUrl).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    try { console.log('BODY', JSON.parse(text)); } catch { console.log('BODY', text); }
  } catch (e) {
    console.error('Request failed', e);
    process.exit(2);
  }
})();
