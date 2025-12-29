import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers) || 'dev-user-fallback';

    const { nin } = await req.json();

    if (!nin || nin.length !== 11) {
      return NextResponse.json(
        { ok: false, message: 'Valid 11-digit NIN is required' },
        { status: 400 }
      );
    }

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    // Use VFD NIN verification API directly without fallback
    const ninResult = await vfdWalletService.verifyNIN({
      accountNumber: user.account_number || 'DEV-ACCOUNT',
      nin,
    });

    if (!ninResult.verified) {
      return NextResponse.json({ 
        ok: false, 
        message: 'NIN verification failed. Please check your NIN and try again.' 
      }, { status: 400 });
    }

    logger.info('NIN verification completed', { userId, verified: ninResult.verified });

    return NextResponse.json({
      ok: true,
      data: {
        verified: ninResult.verified,
        firstName: ninResult.firstName,
        lastName: ninResult.lastName,
        middleName: ninResult.middleName,
        dateOfBirth: ninResult.dateOfBirth,
        gender: ninResult.gender,
        phone: ninResult.phone,
        nin: nin,
        photo: ninResult.photo,
        message: 'NIN verified successfully'
      },
    });

  } catch (error: any) {
    logger.error('NIN verification error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'NIN verification failed' },
      { status: 500 }
    );
  }
}