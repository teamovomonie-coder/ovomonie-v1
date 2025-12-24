import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getWalletBalance } from '@/lib/virtual-accounts';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await getWalletBalance(userId);

    if (!balance) {
      return NextResponse.json({
        success: true,
        data: {
          userId,
          balance: 0,
          ledgerBalance: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}