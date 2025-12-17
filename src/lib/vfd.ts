const VFD_TEST_BASE = 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';
const VFD_LIVE_BASE = 'https://api-apps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

function getBase() {
  return process.env.VFD_API_BASE || VFD_TEST_BASE;
}

// Token exchange/cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(forceRefresh: boolean = false): Promise<string | null> {
  // 1) If explicit token provided via env, prefer it
  if (process.env.VFD_ACCESS_TOKEN && process.env.VFD_ACCESS_TOKEN.trim()) {
    return process.env.VFD_ACCESS_TOKEN.trim();
  }

  // 2) If we have a cached token and it's not expired, return it (unless forcing refresh)
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt - 60000) { // 1 minute buffer
    return cachedToken.token;
  }

  // Clear cache if forcing refresh
  if (forceRefresh) {
    cachedToken = null;
  }

  // 3) Attempt client credentials exchange using consumer key/secret
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  const tokenUrl = process.env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';

  if (!key || !secret) {
    console.error('[VFD] Missing required VFD credentials');
    return null;
  }

  // Try OAuth2 client_credentials style request (common pattern)
  try {
    // Requesting new access token
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => '');
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { text }; }
    }

    // Common field names: access_token, AccessToken, token
    const token = data?.access_token || data?.AccessToken || data?.token || data?.accessToken;
    const expiresIn = Number(data?.expires_in || data?.expires || 0) || 0;

    if (token) {
      const expiresAt = expiresIn > 0 ? Date.now() + expiresIn * 1000 : Date.now() + 14 * 60 * 1000; // Default 14 min
      cachedToken = { token, expiresAt };
      // Access token obtained
      return token;
    }

    // If the token endpoint accepted the request but processing is async (202), try polling
    if (res.status === 202) {
      const location = res.headers.get('location') || res.headers.get('Location') || data?.path || data?.location;
      const maxAttempts = 8;
      const delayMs = 1000;

      // Helper to parse token from response-like objects
      const extractToken = (obj: any) => obj?.access_token || obj?.AccessToken || obj?.token || obj?.accessToken || obj?.data?.accessToken;

      // If a Location was provided, poll that first
      if (location) {
        let pollUrl = location;
        try {
          const u = new URL(pollUrl, tokenUrl);
          pollUrl = u.toString();
        } catch (e) {
          pollUrl = `${tokenUrl.replace(/\/$/, '')}/${String(location).replace(/^\//, '')}`;
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(r => setTimeout(r, attempt === 0 ? 500 : delayMs));
          try {
            const pollRes = await fetch(pollUrl, { headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` } });
            const ct = pollRes.headers.get('content-type') || '';
            let pollData: any = {};
            if (ct.includes('application/json')) pollData = await pollRes.json().catch(() => ({}));
            else {
              const t = await pollRes.text().catch(() => '');
              try { pollData = JSON.parse(t); } catch (e) { pollData = { text: t }; }
            }
            const ptoken = extractToken(pollData);
            const pExpires = Number(pollData?.expires_in || pollData?.expires || 0) || 0;
            if (ptoken) {
              const expiresAt = pExpires > 0 ? Date.now() + pExpires * 1000 : Date.now() + 15 * 60 * 1000;
              cachedToken = { token: ptoken, expiresAt };
              return ptoken;
            }
          } catch (e) {
            // continue polling
          }
        }
      }

      // If no Location header or polling it didn't yield a token, poll the token URL itself
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(r => setTimeout(r, attempt === 0 ? 500 : delayMs));
        try {
          const pollRes = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
          });
          const ct = pollRes.headers.get('content-type') || '';
          let pollData: any = {};
          if (ct.includes('application/json')) pollData = await pollRes.json().catch(() => ({}));
          else {
            const t = await pollRes.text().catch(() => '');
            try { pollData = JSON.parse(t); } catch (e) { pollData = { text: t }; }
          }
          const ptoken = extractToken(pollData);
          const pExpires = Number(pollData?.expires_in || pollData?.expires || 0) || 0;
          if (ptoken) {
            const expiresAt = pExpires > 0 ? Date.now() + pExpires * 1000 : Date.now() + 15 * 60 * 1000;
            cachedToken = { token: ptoken, expiresAt };
            return ptoken;
          }
        } catch (e) {
          // continue polling
        }
      }
    }
  } catch (err) {
    // swallow and return null (caller will handle missing token)
  }

  return null;
}

export async function initiateCardPayment(payload: {
  amount: number;
  reference: string;
  cardNumber: string;
  cardPin: string;
  cvv2: string;
  expiryDate: string; // yymm
  shouldTokenize?: boolean;
}) {
  const base = getBase();
  let token = await getAccessToken();
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  if (!token && !(key && secret)) {
    return { status: 400, ok: false, data: { message: 'VFD access token not configured (VFD_ACCESS_TOKEN or consumer credentials).' } };
  }

  const url = `${base}/initiate/payment`;
  const body = {
    amount: String(payload.amount),
    reference: payload.reference,
    useExistingCard: false,
    cardNumber: payload.cardNumber,
    cardPin: payload.cardPin,
    cvv2: payload.cvv2,
    expiryDate: payload.expiryDate,
    shouldTokenize: !!payload.shouldTokenize,
  };

  const makeRequest = async (accessToken: string | null) => {
    const basic = key && secret ? Buffer.from(`${key}:${secret}`).toString('base64') : null;
    const headersObj: any = { 'Content-Type': 'application/json' };
    if (accessToken) headersObj.AccessToken = accessToken;
    else if (basic) {
      headersObj.Authorization = `Basic ${basic}`;
      headersObj['X-Consumer-Key'] = key;
      headersObj['X-Consumer-Secret'] = secret;
    }

    return await fetch(url, {
      method: 'POST',
      headers: headersObj,
      body: JSON.stringify(body),
    });
  };

  let res = await makeRequest(token);
  let data = await res.json();

  // If token expired, retry with fresh token
  if (data?.message?.toLowerCase().includes('expired') || data?.message?.toLowerCase().includes('invalid token')) {
    console.log('[VFD] Token expired, fetching new token and retrying...');
    token = await getAccessToken(true); // Force refresh
    res = await makeRequest(token);
    data = await res.json();
  }

  return { status: res.status, ok: res.ok, data };
}

export async function validateOtp(otp: string, reference: string) {
  const base = getBase();
  const token = await getAccessToken();
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  if (!token && !(key && secret)) {
    return { status: 400, ok: false, data: { message: 'VFD access token not configured (VFD_ACCESS_TOKEN or consumer credentials).' } };
  }
  const basic = key && secret ? Buffer.from(`${key}:${secret}`).toString('base64') : null;

  const url = `${base}/validate-otp`;
  const headersObj: any = { 'Content-Type': 'application/json' };
  if (token) headersObj.AccessToken = token;
  else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj['X-Consumer-Key'] = key;
    headersObj['X-Consumer-Secret'] = secret;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: headersObj,
    body: JSON.stringify({ otp, reference }),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

export async function paymentDetails(reference: string) {
  const base = getBase();
  const token = await getAccessToken();
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  if (!token && !(key && secret)) {
    return { status: 400, ok: false, data: { message: 'VFD access token not configured (VFD_ACCESS_TOKEN or consumer credentials).' } };
  }
  const basic = key && secret ? Buffer.from(`${key}:${secret}`).toString('base64') : null;

  const url = `${base}/payment-details?reference=${encodeURIComponent(reference)}`;
  const headersObj: any = {};
  if (token) headersObj.AccessToken = token;
  else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj['X-Consumer-Key'] = key;
    headersObj['X-Consumer-Secret'] = secret;
  }
  const res = await fetch(url, { headers: headersObj });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

// Authorize card payment with OTP
export async function authorizeCardOtp({ reference, otp }: { reference: string; otp: string }) {
  const base = getBase();
  const token = await getAccessToken();
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  if (!token && !(key && secret)) {
    return { status: 400, ok: false, data: { message: 'VFD access token not configured.' } };
  }
  const basic = key && secret ? Buffer.from(`${key}:${secret}`).toString('base64') : null;

  const url = `${base}/authorize-otp`;
  const headersObj: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headersObj.AccessToken = token;
  else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj['X-Consumer-Key'] = key!;
    headersObj['X-Consumer-Secret'] = secret!;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: headersObj,
    body: JSON.stringify({ reference, otp }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// Authorize card payment with PIN
export async function authorizeCardPin({ reference, pin }: { reference: string; pin: string }) {
  const base = getBase();
  const token = await getAccessToken();
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  if (!token && !(key && secret)) {
    return { status: 400, ok: false, data: { message: 'VFD access token not configured.' } };
  }
  const basic = key && secret ? Buffer.from(`${key}:${secret}`).toString('base64') : null;

  const url = `${base}/authorize-pin`;
  const headersObj: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headersObj.AccessToken = token;
  else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj['X-Consumer-Key'] = key!;
    headersObj['X-Consumer-Secret'] = secret!;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: headersObj,
    body: JSON.stringify({ reference, pin }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// Export getAccessToken for external use
export { getAccessToken };

const vfdAPI = { initiateCardPayment, validateOtp, paymentDetails, authorizeCardOtp, authorizeCardPin, getAccessToken };

export default vfdAPI;
