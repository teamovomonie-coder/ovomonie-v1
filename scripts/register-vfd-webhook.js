require('dotenv').config({ path: '.env.local' });

const VFD_WEBHOOK_URL = 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/webhooks';

async function registerWebhook() {
  console.log('📡 VFD Webhook Registration\n');

  // Get webhook URL from user
  const webhookUrl = process.argv[2];
  const vfdToken = process.argv[3];

  if (!webhookUrl || !vfdToken) {
    console.log('Usage: node scripts/register-vfd-webhook.js <WEBHOOK_URL> <VFD_TOKEN>\n');
    console.log('Example:');
    console.log('  node scripts/register-vfd-webhook.js https://your-domain.com/api/webhooks/vfd-cards YOUR_TOKEN\n');
    console.log('Steps:');
    console.log('  1. Get VFD token: node scripts/get-vfd-token.js');
    console.log('  2. Run this script with your webhook URL and token\n');
    process.exit(1);
  }

  const payload = {
    url: webhookUrl,
    events: [
      'virtual_card.created',
      'virtual_card.activated',
      'virtual_card.failed',
      'virtual_card.blocked'
    ],
    description: 'Ovomonie Virtual Card Webhooks'
  };

  console.log('📋 Registration Details:');
  console.log(`   URL: ${webhookUrl}`);
  console.log(`   Events: ${payload.events.join(', ')}\n`);

  try {
    const response = await fetch(VFD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vfdToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Registration failed:', data);
      console.log('\nPossible issues:');
      console.log('  - Token expired (get new one)');
      console.log('  - Webhook URL not accessible');
      console.log('  - Invalid VFD credentials\n');
      process.exit(1);
    }

    console.log('✅ Webhook registered successfully!\n');
    console.log('📋 Webhook Details:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n🎉 Setup complete! Virtual cards are ready to use.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

registerWebhook();
