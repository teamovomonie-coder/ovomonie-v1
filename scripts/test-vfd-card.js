// Test VFD Card Payment API with proper token and test cards
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

const VFD_API_BASE = env.VFD_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';
const VFD_TOKEN_URL = env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';
const CONSUMER_KEY = env.VFD_CONSUMER_KEY;
const CONSUMER_SECRET = env.VFD_CONSUMER_SECRET;

// VFD Official Test Cards (from documentation)
const TEST_CARDS = {
  verve: {
    cardNumber: '5060990580000217499',
    cardPin: '1111',
    cvv2: '111',
    expiryDate: '5003', // YYMM format
    otp: '123456',
  },
  visa: {
    cardNumber: '4000000000002503',
    cardPin: '1111',
    cvv2: '111',
    expiryDate: '5003', // YYMM format
    otp: '1234',
  },
  mastercard: {
    cardNumber: '5123450000000008',
    cardPin: '1234',
    cvv2: '100',
    expiryDate: '3901', // YYMM format
    otp: '123456',
  },
};

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

async function testCardPayment(cardType = 'verve') {
  console.log('');
  console.log('=== VFD Card Payment Test ===');
  console.log('Card Type:', cardType.toUpperCase());
  console.log('Base URL:', VFD_API_BASE);
  console.log('');
  
  // Step 1: Get access token
  const accessToken = await getAccessToken();
  
  // Step 2: Initiate card payment
  const card = TEST_CARDS[cardType];
  const url = `${VFD_API_BASE}/initiate/payment`;
  
  const headers = {
    'Content-Type': 'application/json',
    'AccessToken': accessToken,
  };
  
  const body = {
    amount: '100', // ₦100 test amount
    reference: `test_${Date.now()}`,
    useExistingCard: false,
    cardNumber: card.cardNumber,
    cardPin: card.cardPin,
    cvv2: card.cvv2,
    expiryDate: card.expiryDate,
    shouldTokenize: false,
  };
  
  console.log('Request URL:', url);
  console.log('Request Headers:', { ...headers, AccessToken: headers.AccessToken.substring(0, 30) + '...' });
  console.log('Request Body:', { 
    ...body, 
    cardNumber: body.cardNumber.substring(0, 6) + '****' + body.cardNumber.slice(-4), 
    cardPin: '****', 
    cvv2: '***' 
  });
  console.log('');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('Response Status:', res.status, res.statusText);
    
    const text = await res.text();
    console.log('Response Body:', text || '<empty>');
    
    if (text) {
      try {
        const json = JSON.parse(text);
        console.log('');
        console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        
        if (json.status === '00' || json.status === 'success' || res.ok) {
          console.log('');
          console.log('✅ Payment initiation successful!');
          if (json.data?.requiresOtp || json.requiresOtp) {
            console.log('OTP required. Test OTP:', card.otp);
          }
        } else {
          console.log('');
          console.log('❌ Payment failed:', json.message || json.error);
        }
      } catch (e) {
        console.log('(Response is not valid JSON)');
      }
    }
  } catch (err) {
    console.error('Request Error:', err.message);
  }
}

// Run test with Verve card (default)
const cardType = process.argv[2] || 'verve';
testCardPayment(cardType).catch(console.error);
