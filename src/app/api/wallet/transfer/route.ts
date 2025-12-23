import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { initiateOutboundTransfer } from '@/lib/virtual-accounts';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, recipientAccount, recipientBank, narration } = await request.json();

    if (!amount || !recipientAccount || !recipientBank || !narration) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const result = await initiateOutboundTransfer(
      userId,
      amount,
      recipientAccount,
      recipientBank,
      narration
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reference: result.reference
    });

  } catch (error) {
    logger.error('Transfer initiation error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}