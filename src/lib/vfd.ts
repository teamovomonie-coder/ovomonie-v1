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
  if (envToken && envToken.length > 20 && !envToken.includes('your_') && !envToken.includes('placeholder') && !forceRefresh) {
    console.log('[VFD] Using environment token');
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

  // 3) Attempt client credentials exchange using consumer key/secret
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  const tokenUrl = process.env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';

  if (!key || !secret) {
    console.error('[VFD] Missing required VFD credentials');
    return envToken || null;
  }

  // Try VFD-specific token request with proper headers
  try {
    console.log('[VFD] Requesting new access token from:', tokenUrl);
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basic}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumerKey: key,
        consumerSecret: secret,
        validityTime: '3600' // 1 hour
      }),
    });

    console.log('[VFD] Token response status:', res.status);
    
    const responseText = await res.text();
    console.log('[VFD] Token response body:', responseText || '<empty>');
    
    let data: any = {};
    if (responseText) {
      try { 
        data = JSON.parse(responseText); 
      } catch (e) { 
        console.error('[VFD] Failed to parse token response:', e);
        data = { text: responseText }; 
      }
    }

    // VFD returns token in various formats
    const token = data?.data?.access_token || data?.access_token || data?.AccessToken || data?.token || data?.accessToken;
    const expiresIn = Number(data?.data?.expires_in || data?.expires_in || data?.expires || 3600) || 3600;

    if (token && res.ok) {
      const expiresAt = Date.now() + expiresIn * 1000;
      cachedToken = { token, expiresAt };
      tokenExchangeFailed = false;
      console.log('[VFD] Access token obtained successfully, caching for', expiresIn, 'seconds');
      return token;
    }

    // If no token returned, fall back to env token
    console.error('[VFD] No token in response or request failed:', { status: res.status, data });
    tokenExchangeFailed = true;
    return envToken || null;
    
  } catch (err) {
    console.error('[VFD] Token exchange error:', err);
    tokenExchangeFailed = true;
    return envToken || null;
  }
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
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  
  // In development, use environment token directly if available
  let token = process.env.VFD_ACCESS_TOKEN;
  if (!token || token.length < 20 || token.includes('your_') || token.includes('placeholder')) {
    token = await getAccessToken();
  }
  
  console.log('[VFD] initiateCardPayment called');
  console.log('[VFD] Using token:', token ? `YES (${token.substring(0, 20)}...)` : 'NO');
  console.log('[VFD] Using basic auth:', !token && key && secret ? 'YES' : 'NO');
  
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
    
    const headersObj: any = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (accessToken && !useBasicAuth) {
      // Primary: Use both AccessToken and Authorization Bearer headers
      headersObj.AccessToken = accessToken;
      headersObj.Authorization = `Bearer ${accessToken}`;
      console.log('[VFD] Using AccessToken and Bearer headers');
    } else if (basic) {
      // Fallback: Use Basic auth with consumer credentials
      headersObj.Authorization = `Basic ${basic}`;
      console.log('[VFD] Using Basic auth fallback');
    }
    
    console.log('[VFD] Request headers:', { 
      'Content-Type': headersObj['Content-Type'],
      AccessToken: headersObj.AccessToken ? `${headersObj.AccessToken.substring(0, 20)}...` : undefined,
      Authorization: headersObj.Authorization ? 'Basic ***' : undefined,
    });

    return await fetch(url, {
      method: 'POST',
      headers: headersObj,
      body: JSON.stringify(body),
    });
  };

  // First attempt with token (if available) - try to refresh if 403
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

  // If token is invalid (403), try to get a fresh token
  if (res.status === 403 && (data?.message?.toLowerCase().includes('token') || data?.message?.toLowerCase().includes('access denied'))) {
    console.log('[VFD] Token appears invalid, attempting to refresh...');
    const freshToken = await getAccessToken(true); // Force refresh
    if (freshToken && freshToken !== token) {
      console.log('[VFD] Got fresh token, retrying payment...');
      res = await makeRequest(freshToken, false);
      console.log('[VFD] Retry response status:', res.status);
      const retryText = await res.text();
      console.log('[VFD] Retry response body:', retryText || '<empty>');
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
    
    if (vfdMessage.toLowerCase().includes('wallet access token') || vfdMessage.toLowerCase().includes('authentication') || vfdMessage.toLowerCase().includes('unauthorized')) {
      userMessage = 'Unable to process card payment at this time. Please ensure your VFD credentials are valid or try again later.';
      console.error('[VFD] Authentication error - credentials may be invalid or expired:', { vfdMessage, status: res.status, hasToken: !!token, hasBasicAuth: !!(key && secret) });
    } else if (res.status === 403 || res.status === 401) {
      userMessage = 'Payment service authentication failed. Please contact support.';
    } else if (vfdMessage.toLowerCase().includes('insufficient')) {
      userMessage = 'Insufficient funds on card';
    } else if (vfdMessage.toLowerCase().includes('invalid card') || vfdMessage.toLowerCase().includes('card number')) {
      userMessage = 'Invalid card details. Please check your card number, expiry, and CVV.';
    } else if (vfdMessage.toLowerCase().includes('pin')) {
      userMessage = 'Invalid card PIN. Please check your 4-digit card PIN.';
    } else {
      userMessage = vfdMessage || 'Payment processing failed. Please try again.';
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
