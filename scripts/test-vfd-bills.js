// Test VFD Bills API to verify credentials work
const fs = require('fs');
const path = require('path');

// Load environment
const envPath = path.resolve(__dirname, '..', '.env.local');
const raw = fs.readFileSync(envPath, 'utf8');
const lines = raw.split(/\r?\n/);
const env = {};
for (const line of lines) {
  const l = line.trim();
  if (!l || l.startsWith('#')) continue;
  const idx = l.indexOf('=');
  if (idx === -1) continue;
  const k = l.slice(0, idx).trim();
  let v = l.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

const VFD_BILLS_BASE = env.VFD_BILLS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';
const VFD_TOKEN_URL = env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';
const CONSUMER_KEY = env.VFD_CONSUMER_KEY;
const CONSUMER_SECRET = env.VFD_CONSUMER_SECRET;

async function getAccessToken() {
  console.log('Getting access token...');
  const res = await fetch(VFD_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumerKey: CONSUMER_KEY,
      consumerSecret: CONSUMER_SECRET,
      validityTime: '-1',
    }),
  });
  
  const data = await res.json();
  const token = data?.data?.access_token;
  
  if (!token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(data));
  }
  
  console.log('✅ Access token obtained');
  return token;
}

async function testBillsAPI() {
  console.log('');
  console.log('=== VFD Bills API Test ===');
  console.log('Bills Base URL:', VFD_BILLS_BASE);
  console.log('');
  
  // Get access token
  const accessToken = await getAccessToken();
  
  // Test getting biller categories
  console.log('');
  console.log('Testing GET /billercategory...');
  
  const res = await fetch(`${VFD_BILLS_BASE}/billercategory`, {
    method: 'GET',
    headers: {
      'AccessToken': accessToken,
      'Content-Type': 'application/json',
    },
  });
  
  console.log('Response Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response Body:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
  
  if (res.ok) {
    try {
      const json = JSON.parse(text);
      if (json.status === '00') {
        console.log('');
        console.log('✅ Bills API working! Categories count:', json.data?.length || 0);
      } else {
        console.log('');
        console.log('❌ Bills API returned error:', json.message);
      }
    } catch (e) {
      console.log('(Response is not valid JSON)');
    }
  }
}

testBillsAPI().catch(console.error);
