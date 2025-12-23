/**
 * Image Match Verification API
 * Compares selfie with ID card photo for identity verification
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

    const { selfieImage, idCardImage } = await req.json();

    if (!selfieImage || !idCardImage) {
      return NextResponse.json(
        { ok: false, message: 'selfieImage and idCardImage are required (base64 encoded)' },
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

    const matchResult = await vfdWalletService.verifyImageMatch({
      accountNumber: user.account_number,
      selfieImage,
      idCardImage,
    });

    logger.info('Image match verification completed', {
      userId,
      match: matchResult.match,
      confidence: matchResult.confidence,
    });

    return NextResponse.json({
      ok: true,
      data: matchResult,
    });
  } catch (error: any) {
    logger.error('Image match verification error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'Image match verification failed' },
      { status: 500 }
    );
  }
}
