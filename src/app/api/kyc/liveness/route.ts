/**
 * Liveness Check API
 * Detects if user is physically present (anti-spoofing)
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

    const { videoFrames } = await req.json();

    if (!videoFrames || !Array.isArray(videoFrames) || videoFrames.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'videoFrames array is required (base64 encoded frames)' },
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

    const livenessResult = await vfdWalletService.verifyLiveness({
      accountNumber: user.account_number,
      videoFrames,
    });

    logger.info('Liveness check completed', {
      userId,
      isLive: livenessResult.isLive,
      confidence: livenessResult.confidence,
    });

    return NextResponse.json({
      ok: true,
      data: livenessResult,
    });
  } catch (error: any) {
    logger.error('Liveness check error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'Liveness check failed' },
      { status: 500 }
    );
  }
}
