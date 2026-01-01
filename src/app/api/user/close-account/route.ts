import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const scheduledDeletion = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        account_status: 'closed',
        closed_at: now.toISOString(),
        scheduled_deletion_at: scheduledDeletion.toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to close account', { error, userId });
      return NextResponse.json({ message: 'Failed to close account' }, { status: 500 });
    }

    logger.info('Account closed successfully', { userId, scheduledDeletion });

    return NextResponse.json({ 
      message: 'Account closed successfully',
      scheduledDeletion: scheduledDeletion.toISOString()
    });

  } catch (error) {
    logger.error('Account closure error', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}