import { NextResponse } from 'next/server';
import { verifyAuthToken, createAuthToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAuthToken(token);

    if (!payload || !payload.sub) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    // Create a new token with extended expiration
    const newToken = createAuthToken(payload.sub);
    
    logger.info('Token refreshed', { userId: payload.sub });

    return NextResponse.json({ 
      token: newToken,
      userId: payload.sub 
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return NextResponse.json({ message: 'Token refresh failed' }, { status: 500 });
  }
}
