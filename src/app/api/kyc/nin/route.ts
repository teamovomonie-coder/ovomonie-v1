/**
 * NIN Verification API
 * Verifies National Identity Number and retrieves user details
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

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

    if (!user.account_number) {
      return NextResponse.json(
        { ok: false, message: 'Account number not found' },
        { status: 400 }
      );
    }

    const ninResult = await vfdWalletService.verifyNIN({
      accountNumber: user.account_number,
      nin,
    });

    logger.info('NIN verification completed', {
      userId,
      verified: ninResult.verified,
    });

    return NextResponse.json({
      ok: true,
      data: ninResult,
    });
  } catch (error: any) {
    logger.error('NIN verification error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'NIN verification failed' },
      { status: 500 }
    );
  }
}
