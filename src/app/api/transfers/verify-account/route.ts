/**
 * Bank Account Verification API
 * Verifies bank account details using VFD API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { ok: false, message: 'accountNumber and bankCode are required' },
        { status: 400 }
      );
    }

    const verification = await vfdWalletService.verifyBankAccount({
      accountNumber,
      bankCode,
    });

    logger.info('Bank account verified', { userId, accountNumber, accountName: verification.accountName });

    return NextResponse.json({
      ok: true,
      data: verification,
    });
  } catch (error: any) {
    logger.error('Bank account verification error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'Account verification failed' },
      { status: 500 }
    );
  }
}
