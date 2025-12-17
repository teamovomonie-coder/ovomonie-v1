/**
 * VFD Authorization Service
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Authorization/
 */

import { logger } from './logger';

const TOKEN_URL = process.env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';
const CONSUMER_KEY = process.env.VFD_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.VFD_CONSUMER_SECRET;
const STATIC_TOKEN = process.env.VFD_ACCESS_TOKEN;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

/**
 * Get VFD Access Token
 * Priority: 1) Static token from env, 2) OAuth token (cached), 3) Request new token
 */
export async function getVFDAccessToken(): Promise<string> {
  // 1. Use static token if available (long-lived token)
  if (STATIC_TOKEN && STATIC_TOKEN.length > 50) {
    logger.info('Using static VFD access token');
    return STATIC_TOKEN;
  }

  // 2. Check cached token
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    logger.info('Using cached VFD access token');
    return tokenCache.token;
  }

  // 3. Request new token via OAuth 2.0 Client Credentials
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('VFD credentials not configured');
  }

  logger.info('Requesting new VFD access token');

  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('VFD token request failed', { status: response.status, error });
    throw new Error(`Failed to get VFD access token: ${response.status}`);
  }

  const data: TokenResponse = await response.json();

  // Cache token with 5-minute buffer before expiry
  const expiresIn = data.expires_in || 3600;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 300) * 1000,
  };

  logger.info('VFD access token obtained', { expiresIn });
  return data.access_token;
}

/**
 * Get authorization headers for VFD API calls
 */
export async function getVFDHeaders(): Promise<Record<string, string>> {
  const token = await getVFDAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Clear cached token (useful for testing or error recovery)
 */
export function clearVFDTokenCache(): void {
  tokenCache = null;
  logger.info('VFD token cache cleared');
}
