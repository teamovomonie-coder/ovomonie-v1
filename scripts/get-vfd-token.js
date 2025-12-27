require('dotenv').config({ path: '.env.local' });

const VFD_TOKEN_URL = 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';

async function getVFDToken() {
  const consumerKey = process.env.VFD_CONSUMER_KEY;
  const consumerSecret = process.env.VFD_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    console.error('❌ VFD credentials not found in .env.local');
    console.log('\nAdd these to your .env.local:');
    console.log('VFD_CONSUMER_KEY=your_key');
    console.log('VFD_CONSUMER_SECRET=your_secret');
    process.exit(1);
  }

  try {
    console.log('🔑 Getting VFD access token...\n');

    const response = await fetch(VFD_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumerKey, consumerSecret })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new Error('No access token in response');
    }

    console.log('✅ Access Token Retrieved!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(data.accessToken);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Copy this token for webhook registration');
    console.log(`⏰ Expires in: ${data.expiresIn || '1 hour'}\n`);

    return data.accessToken;
  } catch (error) {
    console.error('❌ Failed to get VFD token:', error.message);
    process.exit(1);
  }
}

getVFDToken();
