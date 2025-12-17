import {createHmac, randomBytes, scryptSync, timingSafeEqual} from 'crypto';
import { serverEnv } from './env.server';

const TOKEN_PREFIX = 'ovotoken';
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const KEY_LENGTH = 64; // bytes for scrypt output

const getAuthSecret = () => serverEnv.AUTH_SECRET;

export type AuthTokenPayload = {
  sub: string; // userId
  iat: number;
  exp: number;
};

export function createAuthToken(userId: string, ttlSeconds = TOKEN_TTL_SECONDS): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    sub: userId,
    iat,
    exp: iat + ttlSeconds,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getAuthSecret()).update(payloadB64).digest('base64url');

  return `${TOKEN_PREFIX}.${payloadB64}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
    if (!token || !token.startsWith(`${TOKEN_PREFIX}.`)) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [, payloadB64, signature] = parts;
    let secret: string;
    try {
        secret = getAuthSecret();
    } catch (error) {
        console.error('Auth token verification failed.');
        return null;
    }
    const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');

  // timingSafeEqual throws if lengths differ, so guard first
  if (expectedSig.length !== signature.length) return null;
  const isValidSig = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  if (!isValidSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as AuthTokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(secret, salt, KEY_LENGTH);
  return `${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

export function verifySecret(secret: string, storedHash: string): boolean {
  const [saltB64, hashB64] = storedHash.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const stored = Buffer.from(hashB64, 'base64');
  const derived = scryptSync(secret, salt, stored.length);
  // ensure constant-time comparison
  return timingSafeEqual(derived, stored);
}
