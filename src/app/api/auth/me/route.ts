import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getUserById } from '@/lib/db';
import { logger } from '@/lib/logger';
import { generateAuthToken } from '@/lib/auth';

export async function GET() {
  try {
    const reqHeaders = await headers();
    const userId = getUserIdFromToken(reqHeaders as any) || 'dev-user-fallback';
    
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    logger.info('User profile fetched', { userId });

    return NextResponse.json({
      userId: user.id,
      phone: user.phone,
      fullName: user.full_name,
      email: user.email,
      accountNumber: user.account_number,
      balance: user.balance || 0,
      kycTier: user.kyc_tier || 1,
      isAgent: user.is_agent || false,
      status: user.status || 'active',
      avatarUrl: user.avatar_url,
      photoUrl: user.avatar_url,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Handle biometric authentication
export async function POST(request: NextRequest) {
  try {
    const { phone, method } = await request.json();
    
    if (method !== 'biometric') {
      return NextResponse.json({ message: 'Invalid method' }, { status: 400 });
    }

    // For biometric auth, we trust that the client has already verified the biometric
    // In a real implementation, you might want additional server-side verification
    const user = await getUserById(phone); // Using phone as userId for biometric
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const token = generateAuthToken(user.id);
    
    logger.info('Biometric authentication successful', { userId: user.id });
    
    return NextResponse.json({
      token,
      userId: user.id,
      message: 'Biometric authentication successful'
    });
  } catch (error) {
    console.error('Biometric auth error:', error);
    return NextResponse.json({ message: 'Authentication failed' }, { status: 500 });
  }
}
