import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { notificationService } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { transactionId, channel = 'in-app' } = body || {};
    if (!transactionId) return NextResponse.json({ ok: false, message: 'transactionId is required' }, { status: 400 });

    const title = 'Receipt shared';
    const bodyText = `You shared receipt ${transactionId} (${channel})`;

    try {
      const notifId = await notificationService.create({
        user_id: userId,
        title,
        body: bodyText,
        category: 'receipt',
        reference: transactionId,
        type: 'share',
      });

      return NextResponse.json({ ok: true, message: 'Notification created', id: notifId });
    } catch (err) {
      logger.error('Failed to create notification', err);
      return NextResponse.json({ ok: false, message: 'Failed to create notification' }, { status: 500 });
    }
  } catch (err) {
    logger.error('Share receipt API error', err);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
