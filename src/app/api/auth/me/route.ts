import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { getUserById } from '@/lib/db';

export async function GET() {
  try {
    const reqHeaders = await headers();
    const userId = getUserIdFromToken(reqHeaders as any);
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      phone: user.phone,
      fullName: user.full_name,
      email: user.email,
      accountNumber: user.account_number,
      balance: user.balance,
      kycTier: user.kyc_tier,
      isAgent: user.is_agent,
      status: user.status,
      avatarUrl: user.avatar_url,
      photoUrl: user.avatar_url,
      referralCode: (user as any).referral_code || (user as any).referralCode || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
