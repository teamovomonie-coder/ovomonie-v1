const VFD_TEST_BASE = 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';
const VFD_LIVE_BASE = 'https://api-apps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

function getBase() {
  return process.env.VFD_API_BASE || VFD_TEST_BASE;
}

// Token exchange/cache
let cachedToken: { token: string; expiresAt: number } | null = null;
let tokenExchangeFailed = false; // Track if token exchange has failed

async function getAccessToken(forceRefresh: boolean = false): Promise<string | null> {
  // 1) If explicit token provided via env (and it's not a placeholder), prefer it
  const envToken = process.env.VFD_ACCESS_TOKEN?.trim();
  if (envToken && envToken.length > 20 && !envToken.includes('your_') && !envToken.includes('placeholder')) {
    return envToken;
  }

  // 2) If we have a cached token and it's not expired, return it (unless forcing refresh)
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt - 60000) { // 1 minute buffer
    console.log('[VFD] Using cached token, expires in', Math.round((cachedToken.expiresAt - Date.now()) / 1000), 'seconds');
    return cachedToken.token;
  }

  // Clear cache if forcing refresh
  if (forceRefresh) {
    cachedToken = null;
    tokenExchangeFailed = false;
  }

  // 3) If token exchange previously failed and we're not forcing refresh, skip it
  if (tokenExchangeFailed && !forceRefresh) {
    console.log('[VFD] Token exchange previously failed, will use Basic auth');
    return null;
  }

  // 4) Attempt client credentials exchange using consumer key/secret
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  const tokenUrl = process.env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';
  const base = getBase();

  if (!key || !secret) {
    console.error('[VFD] Missing required VFD credentials');
    return null;
  }

  // Try VFD-specific token request (JSON body with consumerKey/consumerSecret)
  try {
    console.log('[VFD] Requesting new access token from:', tokenUrl);
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consumerKey: key,
        consumerSecret: secret,
        validityTime: '-1', // -1 means token doesn't expire
      }),
    });

    console.log('[VFD] Token response status:', res.status);
    
    const contentType = res.headers.get('content-type') || '';
    let data: any = {};
    const text = await res.text();
    console.log('[VFD] Token response body:', text || '<empty>');
    
    if (text) {
      try { 
        data = JSON.parse(text); 
      } catch (e) { 
        data = { text }; 
      }
    }

    // VFD returns token in data.access_token (nested)
    // Also check common field names: access_token, AccessToken, token
    const token = data?.data?.access_token || data?.access_token || data?.AccessToken || data?.token || data?.accessToken;
    const expiresIn = Number(data?.data?.expires_in || data?.expires_in || data?.expires || 0) || 0;

        if (token) {
      // VFD returns very large expires_in for non-expiring tokens, use 24 hours as practical limit
      const practicalExpiry = expiresIn > 86400 ? 86400 : (expiresIn || 840);
      const expiresAt = Date.now() + practicalExpiry * 1000;
      cachedToken = { token, expiresAt };
      tokenExchangeFailed = false;
      console.log('[VFD] Access token obtained successfully, caching for', practicalExpiry, 'seconds');
      return token;
        }

    // If no token returned, log the issue
    console.error('[VFD] No token in response:', data);
    
    // If the token endpoint returned 202 (async processing) or empty response, mark as failed
    // and don't retry - we'll use Basic auth fallback instead
    if (res.status === 202 || !text) {
      console.log('[VFD] Token endpoint returned 202/empty - will use Basic auth fallback');
      tokenExchangeFailed = true;
      return null;
    }
    
    // If the token endpoint returned 202 (async processing), try polling
    if (res.status === 202) {
      console.log('[VFD] Token request returned 202, trying polling...');
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
  
  console.log('[VFD] initiateCardPayment called');
  console.log('[VFD] Token obtained:', token ? `${token.substring(0, 20)}...` : 'null (will use Basic auth)');
  console.log('[VFD] Consumer key present:', !!key);
  
  if (!token && !(key && secret)) {
    console.error('[VFD] No valid credentials available');
    return { status: 400, ok: false, data: { message: 'VFD credentials not configured. Please contact support.' } };
  }

  const url = `${base}/initiate/payment`;
  console.log('[VFD] Request URL:', url);
  
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
  
  // Log masked request body for debugging
  console.log('[VFD] Request body:', {
    amount: body.amount,
    reference: body.reference,
    useExistingCard: body.useExistingCard,
    cardNumber: `${body.cardNumber.substring(0, 6)}****${body.cardNumber.slice(-4)}`,
    cardPin: '****',
    cvv2: '***',
    expiryDate: body.expiryDate,
    shouldTokenize: body.shouldTokenize,
  });
  
  console.log('[VFD] IMPORTANT: cardPin is the 4-digit card PIN, NOT the authorization PIN');
  console.log('[VFD] If VFD requires authorization, use authorize-pin or authorize-otp endpoint with a separate authorization PIN');

  const makeRequest = async (accessToken: string | null, useBasicAuth: boolean = false) => {
    const basic = key && secret ? Buffer.from(`${key}:${secret}`).toString('base64') : null;
    // VFD Cards API - try multiple auth methods
    const headersObj: any = { 
      'Content-Type': 'application/json',
    };
    
    if (accessToken && !useBasicAuth) {
      // Use both AccessToken and Authorization Bearer
      headersObj.AccessToken = accessToken;
      headersObj.Authorization = `Bearer ${accessToken}`;
      console.log('[VFD] Using AccessToken + Bearer headers');
    } else if (basic) {
      // Use Basic auth with consumer credentials
      headersObj.Authorization = `Basic ${basic}`;
      headersObj.ConsumerKey = key;
      headersObj.ConsumerSecret = secret;
      console.log('[VFD] Using Basic auth + consumer credentials');
    }
    
    console.log('[VFD] Request headers:', { 
      'Content-Type': headersObj['Content-Type'],
      AccessToken: headersObj.AccessToken ? `${headersObj.AccessToken.substring(0, 20)}...` : undefined,
      Authorization: headersObj.Authorization ? '***' : undefined,
      ConsumerKey: headersObj.ConsumerKey ? '***' : undefined,
    });

    return await fetch(url, {
      method: 'POST',
      headers: headersObj,
      body: JSON.stringify(body),
    });
  };

  // First attempt with token (if available)
  let res = await makeRequest(token, false);
  console.log('[VFD] Payment response status:', res.status);
  
  let data: any;
  const responseText = await res.text();
  console.log('[VFD] Payment response body:', responseText || '<empty>');
  
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    data = { message: responseText || 'No response body' };
  }

  // If first attempt failed with auth error and we used token, retry with Basic auth
  const errorMsg = (data?.message || '').toLowerCase();
  if ((res.status === 401 || res.status === 403 || errorMsg.includes('unauthorized') || errorMsg.includes('invalid token') || errorMsg.includes('expired')) && token) {
    console.log('[VFD] Token auth failed, retrying with Basic auth...');
    res = await makeRequest(null, true);
    console.log('[VFD] Basic auth response status:', res.status);
    const retryText = await res.text();
    console.log('[VFD] Basic auth response body:', retryText || '<empty>');
    try {
      data = JSON.parse(retryText);
    } catch (e) {
      data = { message: retryText || 'No response body' };
    }
  }
  
  // If still failing with auth error, try getting fresh token and retry
  if ((res.status === 401 || res.status === 403) && !token) {
    console.log('[VFD] Basic auth also failed. Trying fresh token exchange...');
    const freshToken = await getAccessToken(true); // Force refresh
    if (freshToken) {
      res = await makeRequest(freshToken, false);
      console.log('[VFD] Fresh token response status:', res.status);
      const retryText = await res.text();
      console.log('[VFD] Fresh token response body:', retryText || '<empty>');
      try {
        data = JSON.parse(retryText);
      } catch (e) {
        data = { message: retryText || 'No response body' };
      }
    }
  }

  // Provide user-friendly error message if still failing
  if (!res.ok) {
    let userMessage: string;
    const vfdMessage = data?.message || data?.error || '';
    const vfdCode = data?.code || data?.responseCode || '';
    
    console.error('[VFD] Payment failed:', { status: res.status, message: vfdMessage, code: vfdCode, fullResponse: data });
    
    if (vfdMessage.toLowerCase().includes('wallet access token') || vfdMessage.toLowerCase().includes('authentication')) {
      userMessage = 'Failed to authenticate with payment gateway. Please contact support.';
      console.error('[VFD] Authentication error - credentials may need to be refreshed or activated');
    } else if (res.status === 403 || res.status === 401) {
      userMessage = 'Failed to authenticate with payment gateway';
    } else if (vfdMessage.toLowerCase().includes('insufficient')) {
      userMessage = 'Insufficient funds on card';
    } else if (vfdMessage.toLowerCase().includes('invalid card')) {
      userMessage = 'Invalid card details. Please check and try again.';
    } else {
      userMessage = vfdMessage || 'Payment initiation failed. Please try again.';
    }
    
    return { status: res.status, ok: false, data: { ...data, message: userMessage, vfdError: vfdMessage, vfdCode } };
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
  const headersObj: any = { 
    'Content-Type': 'application/json',
    'base-url': base,
  };
  if (token) {
    headersObj.AccessToken = token;
  } else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj.ConsumerKey = key;
    headersObj.ConsumerSecret = secret;
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
  const headersObj: any = { 'base-url': base };
  if (token) {
    headersObj.AccessToken = token;
  } else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj.ConsumerKey = key;
    headersObj.ConsumerSecret = secret;
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
  const headersObj: Record<string, string> = { 
    'Content-Type': 'application/json',
    'base-url': base,
  };
  if (token) {
    headersObj.AccessToken = token;
  } else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj.ConsumerKey = key!;
    headersObj.ConsumerSecret = secret!;
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
  const headersObj: Record<string, string> = { 
    'Content-Type': 'application/json',
    'base-url': base,
  };
  if (token) {
    headersObj.AccessToken = token;
  } else if (basic) {
    headersObj.Authorization = `Basic ${basic}`;
    headersObj.ConsumerKey = key!;
    headersObj.ConsumerSecret = secret!;
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
