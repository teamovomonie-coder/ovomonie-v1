// Test VFD Token Exchange (Official VFD format)
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found at', envPath);
    process.exit(2);
  }

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

  if (env.VFD_ACCESS_TOKEN && env.VFD_ACCESS_TOKEN.trim() && !env.VFD_ACCESS_TOKEN.includes('your_')) {
    console.log('VFD_ACCESS_TOKEN is already set in .env.local');
    console.log('Token:', env.VFD_ACCESS_TOKEN.substring(0, 30) + '...');
    return;
  }

  const key = env.VFD_CONSUMER_KEY;
  const secret = env.VFD_CONSUMER_SECRET;
  // Use v1.1 endpoint as per official VFD docs
  const tokenUrl = env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';

  if (!key || !secret) {
    console.error('VFD_CONSUMER_KEY or VFD_CONSUMER_SECRET missing in .env.local');
    process.exit(3);
  }

  console.log('=== VFD Token Exchange Test ===');
  console.log('Token URL:', tokenUrl);
  console.log('Consumer Key:', key.substring(0, 10) + '...');
  console.log('');

  // VFD official format: JSON body with consumerKey, consumerSecret, validityTime
  const requestBody = {
    consumerKey: key,
    consumerSecret: secret,
    validityTime: '-1', // -1 means token doesn't expire
  };
  
  console.log('Request Body:', JSON.stringify({ ...requestBody, consumerSecret: '***' }, null, 2));
  console.log('');

  try {
    const fetchFn = global.fetch || (await import('node-fetch')).default;
    const res = await fetchFn(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('HTTP', res.status, res.statusText);
    console.log('Response headers:');
    for (const [k, v] of res.headers.entries()) {
      console.log('  ', k + ':', v);
    }
    const text = await res.text();
    console.log('');
    console.log('Response body (raw):', text || '<empty>');
    
    if (text) {
      try {
        const parsed = JSON.parse(text);
        console.log('');
        console.log('Response JSON:', JSON.stringify(parsed, null, 2));
        
        // Check for token in various field names
        const token = parsed.access_token || parsed.AccessToken || parsed.token || parsed.accessToken || parsed.data?.accessToken;
        if (token) {
          console.log('');
          console.log('✅ SUCCESS! Access Token obtained:');
          console.log(token);
          console.log('');
          console.log('Add this to your .env.local:');
          console.log(`VFD_ACCESS_TOKEN=${token}`);
        } else {
          console.log('');
          console.log('❌ No access token found in response');
        }
      } catch (e) {
        console.log('(Response is not valid JSON)');
      }
    }
  } catch (err) {
    console.error('Token request failed:', err && err.message ? err.message : err);
    process.exit(4);
  }
}

main();
