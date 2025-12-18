import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
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

    const { id } = params;

    // Try to find by ID first
    let { data, error } = await db
      .from('pending_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // If not found by ID, try by reference
    if (error || !data) {
      const result = await db
        .from('pending_transactions')
        .select('*')
        .eq('reference', id)
        .eq('user_id', userId)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    logger.error('Transaction GET error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return NextResponse.json({ ok: false, message: 'Invalid status' }, { status: 400 });
    }

    const updates: any = { status };
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from('pending_transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, message: 'Transaction not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data, message: `Transaction marked as ${status}` });
  } catch (error) {
    logger.error('Transaction PATCH error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
