import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getUserById } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const reqHeaders = await headers();
    const userId = await getUserIdFromToken(reqHeaders as any);
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

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
