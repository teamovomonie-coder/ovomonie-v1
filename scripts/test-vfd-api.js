/**
 * Test VFD Card Payment and Bills API with the configured access token
 * Run with: node scripts/test-vfd-api.js [card-type]
 * Card types: verve, visa, mastercard
 */

require('dotenv').config({ path: '.env.local' });

const VFD_API_BASE = process.env.VFD_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';
const VFD_BILLS_API_BASE = process.env.VFD_BILLS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';
const VFD_ACCESS_TOKEN = process.env.VFD_ACCESS_TOKEN;

// VFD Test Cards from documentation
const TEST_CARDS = {
  verve: {
    cardNumber: '5060990580000217499',
    pin: '1111',
    cvv: '111',
    expiry: '5003', // YYMM format
    otp: '123456',
  },
  visa: {
    cardNumber: '4000000000002503',
    pin: '1111',
    cvv: '111',
    expiry: '5003',
    otp: '1234',
  },
  mastercard: {
    cardNumber: '5123450000000008',
    pin: '1234',
    cvv: '100',
    expiry: '3901',
    otp: '12345',
  },
};

async function testCardPayment(cardType = 'verve') {
  const card = TEST_CARDS[cardType];
  if (!card) {
    console.error(`Unknown card type: ${cardType}. Available: verve, visa, mastercard`);
    return;
  }

  console.log('=== VFD Card Payment Test ===');
  console.log(`Card Type: ${cardType}`);
  console.log(`API Base: ${VFD_API_BASE}`);
  console.log(`Access Token: ${VFD_ACCESS_TOKEN ? VFD_ACCESS_TOKEN.substring(0, 40) + '...' : 'NOT SET'}`);
  console.log('');

  if (!VFD_ACCESS_TOKEN) {
    console.error('ERROR: VFD_ACCESS_TOKEN is not set in .env.local');
    return;
  }

  const reference = `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  const payload = {
    amount: '100', // ₦100 test amount
    reference,
    useExistingCard: false,
    cardNumber: card.cardNumber,
    cardPin: card.pin,
    cvv2: card.cvv,
    expiryDate: card.expiry,
    shouldTokenize: false,
  };

  console.log('Request payload:');
  console.log({
    ...payload,
    cardNumber: payload.cardNumber.substring(0, 6) + '****' + payload.cardNumber.slice(-4),
    cardPin: '****',
    cvv2: '***',
  });
  console.log('');

  try {
    const url = `${VFD_API_BASE}/initiate/payment`;
    console.log(`POST ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': VFD_ACCESS_TOKEN,
        'base-url': VFD_API_BASE,
      },
      body: JSON.stringify(payload),
    });

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log('Response Body:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('\nParsed Response:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.status === '00' || json.status === '0' || response.ok) {
        console.log('\n✓ Payment initiated successfully!');
        if (json.transactionId || json.data?.transactionId) {
          console.log(`Transaction ID: ${json.transactionId || json.data?.transactionId}`);
        }
      } else {
        console.log(`\n✗ Payment failed with status: ${json.status}`);
        console.log(`Message: ${json.message || json.data?.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.log('\nResponse is not JSON');
    }
  } catch (error) {
    console.error('\nRequest failed:', error.message);
  }
}

// Test Bills API
async function testBillsCategories() {
  console.log('\n=== VFD Bills API Test ===');
  console.log(`API Base: ${VFD_BILLS_API_BASE}`);
  
  try {
    const url = `${VFD_BILLS_API_BASE}/getallbillscategory`;
    console.log(`GET ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': VFD_ACCESS_TOKEN,
      },
    });

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    try {
      const json = JSON.parse(text);
      
      if (json.status === '00' || json.status === '0' || response.ok) {
        console.log('\n✓ Bills API working!');
        console.log('\nBills Categories:');
        if (json.data && Array.isArray(json.data)) {
          json.data.forEach(cat => {
            console.log(`  - ${cat.categoryName || cat.name} (ID: ${cat.categoryId || cat.id})`);
          });
        } else {
          console.log(JSON.stringify(json, null, 2));
        }
      } else {
        console.log(`\n✗ Bills API failed with status: ${json.status}`);
        console.log(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log('Response:', text.substring(0, 500));
    }
  } catch (error) {
    console.error('Bills API request failed:', error.message);
  }
}

async function main() {
  const cardType = process.argv[2] || 'verve';
  await testCardPayment(cardType);
  await testBillsCategories();
}

main();
