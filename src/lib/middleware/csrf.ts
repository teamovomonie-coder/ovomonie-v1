import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_SECRET = process.env.AUTH_SECRET || 'fallback-secret';

export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${token}:${timestamp}`)
    .digest('hex');
  
  return `${token}:${timestamp}:${signature}`;
}

export function verifyCsrfToken(token: string): boolean {
  try {
    const [tokenPart, timestamp, signature] = token.split(':');
    
    if (!tokenPart || !timestamp || !signature) {
      return false;
    }
    
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(`${tokenPart}:${timestamp}`)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return false;
    }
    
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

export function csrfProtection(request: NextRequest): NextResponse | null {
  const method = request.method;
  
  // Only check CSRF for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null;
  }
  
  // Skip CSRF for auth endpoints (they use other protection)
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return null;
  }
  
  const token = request.headers.get(CSRF_TOKEN_HEADER);
  
  if (!token || !verifyCsrfToken(token)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  }
  
  return null;
}
