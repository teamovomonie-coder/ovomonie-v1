// Attempt to register webhook with VFD (if API endpoint exists)
require('dotenv').config({ path: '.env.local' });

async function registerWebhook() {
  console.log('🔗 Attempting to register webhook with VFD...\n');

  const webhookUrl = 'https://ovomonie-v1.vercel.app/api/webhooks/vfd';
  
  // Try common webhook registration endpoints
  const endpoints = [
    `${process.env.VFD_WALLET_API_BASE}/webhook/register`,
    `${process.env.VFD_API_BASE}/webhook/register`,
    `https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/webhook/register`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'AccessToken': process.env.VFD_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookUrl,
          events: ['CREDIT', 'VIRTUAL_ACCOUNT_CREDIT'],
          method: 'POST'
        })
      });

      const result = await response.json();
      console.log('Response:', result);
      
      if (response.ok) {
        console.log('✅ Webhook registered successfully!');
        return;
      }
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  }

  console.log('\n📧 Manual registration required. Contact VFD support:');
  console.log('Email: integration@vfdtech.ng');
  console.log('Webhook URL:', webhookUrl);
}

registerWebhook();