// Test VFD Wallet API
const fs = require('fs');
const path = require('path');

async function main() {
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

  const token = env.VFD_ACCESS_TOKEN;
  const walletBase = env.VFD_WALLET_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

  if (!token) {
    console.error('VFD_ACCESS_TOKEN not set in .env.local');
    process.exit(1);
  }

  console.log('=== VFD Wallet API Test ===\n');
  console.log('Wallet Base:', walletBase);
  console.log('Token:', token.substring(0, 50) + '...\n');

  const headers = {
    'AccessToken': token,
    'Content-Type': 'application/json'
  };

  // Test 1: Account Enquiry
  console.log('1. Testing Account Enquiry...');
  try {
    const res = await fetch(`${walletBase}/account/enquiry`, {
      method: 'GET',
      headers
    });
    const data = await res.text();
    console.log('   Status:', res.status);
    console.log('   Response:', data.substring(0, 300));
    console.log('');
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test 2: Bank List
  console.log('2. Testing Bank List...');
  try {
    const res = await fetch(`${walletBase}/bank/list`, {
      method: 'GET',
      headers
    });
    const data = await res.text();
    console.log('   Status:', res.status);
    const parsed = JSON.parse(data);
    if (parsed.data && Array.isArray(parsed.data)) {
      console.log('   Banks found:', parsed.data.length);
      console.log('   First 3 banks:', JSON.stringify(parsed.data.slice(0, 3), null, 2));
    } else {
      console.log('   Response:', data.substring(0, 200));
    }
    console.log('');
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test 3: Virtual Account Creation
  console.log('3. Testing Virtual Account Creation...');
  try {
    const res = await fetch(`${walletBase}/clientAccountCreation`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bvn: '12345678901',
        dateOfBirth: '1990-01-01',
        gender: 1,
        lastName: 'Test',
        otherNames: 'User',
        phone: '08012345678',
        address: 'Test Address Lagos',
        email: 'testuser@ovomonie.com'
      })
    });
    const data = await res.text();
    console.log('   Status:', res.status);
    console.log('   Response:', data);
    console.log('');
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test 4: Transfer Recipient Lookup
  console.log('4. Testing Transfer Recipient Lookup...');
  try {
    const res = await fetch(`${walletBase}/transfer/recipient?accountNumber=0123456789&bankCode=044`, {
      method: 'GET',
      headers
    });
    const data = await res.text();
    console.log('   Status:', res.status);
    console.log('   Response:', data.substring(0, 200));
    console.log('');
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test 5: Transaction List
  console.log('5. Testing Transaction List...');
  try {
    const res = await fetch(`${walletBase}/transactions`, {
      method: 'GET',
      headers
    });
    const data = await res.text();
    console.log('   Status:', res.status);
    console.log('   Response:', data.substring(0, 300));
    console.log('');
  } catch (e) {
    console.log('   Error:', e.message);
  }

  console.log('=== Test Complete ===');
}

main().catch(console.error);
