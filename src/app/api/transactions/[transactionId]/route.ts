import { NextRequest, NextResponse } from 'next/server';
import { db, transactionService } from '@/lib/db';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const transactionId = parts[parts.length - 1];

    if (!transactionId) return NextResponse.json({ ok: false, message: 'Missing transaction id' }, { status: 400 });

    // 1) Try to fetch by primary id from financial_transactions
    const { data: txById, error: idErr } = await db.from('financial_transactions').select('*').eq('id', transactionId).limit(1).maybeSingle();
    if (idErr && idErr.code !== 'PGRST116') {
      logger.error('Fetch transaction by id error', idErr);
    }

    if (txById) {
      if (txById.user_id !== userId) return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
      return NextResponse.json({ ok: true, data: txById });
    }

    // 2) Fallback: try by reference
    try {
      const txByRef = await transactionService.getByReference(transactionId);
      if (!txByRef) return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
      if (txByRef.user_id !== userId) return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
      return NextResponse.json({ ok: true, data: txByRef });
    } catch (err) {
      logger.error('Fallback fetch transaction error', err);
      return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
  } catch (err) {
    logger.error('GET /api/transactions/[id] error', err);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
