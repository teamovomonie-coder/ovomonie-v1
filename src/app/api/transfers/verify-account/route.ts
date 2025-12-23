/**
 * Bank Account Verification API
 * Verifies bank account details using VFD API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  let accountNumber: string | undefined;
  let bankCode: string | undefined;
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    accountNumber = body?.accountNumber;
    bankCode = body?.bankCode;

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
