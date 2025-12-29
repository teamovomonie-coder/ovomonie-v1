/**
 * AML Verification API
 * Screens customers against PEP, sanctions, and adverse media lists
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, dateOfBirth, nationality } = await req.json();

    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json(
        { ok: false, message: 'firstName, lastName, and dateOfBirth are required' },
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

    const amlResult = await vfdWalletService.verifyAML({
      accountNumber: user.account_number,
      firstName,
      lastName,
      dateOfBirth,
      nationality,
    });

    logger.info('AML verification completed', {
      userId,
      status: amlResult.status,
      riskLevel: amlResult.riskLevel,
    });

    return NextResponse.json({
      ok: true,
      data: amlResult,
    });
  } catch (error: any) {
    logger.error('AML verification error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'AML verification failed' },
      { status: 500 }
    );
  }
}
