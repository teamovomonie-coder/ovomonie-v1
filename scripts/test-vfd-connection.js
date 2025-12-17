// Test VFD API connection
require('dotenv').config({ path: '.env.local' });

async function testVFDConnection() {
  console.log('🔗 Testing VFD API connection...\n');

  try {
    // Test VFD Wallet API
    const response = await fetch(`${process.env.VFD_WALLET_API_BASE}/account/enquiry`, {
      headers: {
        'AccessToken': process.env.VFD_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('VFD API Response:', result);

    if (result.status === '00') {
      console.log('✅ VFD API connection successful');
      console.log('Pool Account:', result.data?.accountNo);
    } else {
      console.log('❌ VFD API error:', result.message);
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testVFDConnection();