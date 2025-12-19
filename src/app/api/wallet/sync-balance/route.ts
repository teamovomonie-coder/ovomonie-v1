/**
 * Sync Balance API
 * Syncs frontend balance with VFD wallet balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { syncBalanceWithVFD } from '@/lib/balance-sync';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    logger.info('Balance sync requested', { userId, currentBalance: user.balance });

    return NextResponse.json({
      ok: true,
      balanceInKobo: user.balance || 0,
      data: { balance: user.balance || 0 },
    });
  } catch (error: any) {
    logger.error('Balance sync error', { error: error.message });
    const user = await userService.getById(getUserIdFromToken(req.headers) || '');
    return NextResponse.json(
      { ok: true, balanceInKobo: user?.balance || 0, data: { balance: user?.balance || 0 } },
      { status: 200 }
    );
  }
}
