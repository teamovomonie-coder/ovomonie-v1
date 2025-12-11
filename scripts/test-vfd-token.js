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

  if (env.VFD_ACCESS_TOKEN && env.VFD_ACCESS_TOKEN.trim()) {
    console.log('VFD_ACCESS_TOKEN is set in .env.local:');
    console.log(env.VFD_ACCESS_TOKEN);
    return;
  }

  const key = env.VFD_CONSUMER_KEY;
  const secret = env.VFD_CONSUMER_SECRET;
  const tokenUrl = env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';

  if (!key || !secret) {
    console.error('VFD_CONSUMER_KEY or VFD_CONSUMER_SECRET missing in .env.local');
    process.exit(3);
  }

  console.log('Requesting token from', tokenUrl);

  try {
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    const fetchFn = global.fetch || (await import('node:undici')).fetch;
    const res = await fetchFn(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    console.log('HTTP', res.status, res.statusText);
      console.log('Response headers:');
      for (const [k, v] of res.headers.entries()) {
        console.log('  ', k + ':', v);
      }
      const text = await res.text();
      console.log('Response body (raw):', text || '<empty>');
      try {
        const parsed = text ? JSON.parse(text) : null;
        if (parsed) console.log('Response JSON:', parsed);
      } catch (e) {
        // not JSON
      }
  } catch (err) {
    console.error('Token request failed:', err && err.message ? err.message : err);
    process.exit(4);
  }
}

main();
