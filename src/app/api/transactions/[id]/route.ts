import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Transaction ID required' }, { status: 400 });
    }

    const { data, error } = await db
      .from('pending_transactions')
      .select('*')
      .eq('reference', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      logger.warn('Transaction not found:', { id, userId });
      return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    logger.error('Transaction fetch error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
