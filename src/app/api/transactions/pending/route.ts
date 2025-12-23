import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface PendingTransaction {
  id: string;
  user_id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
  amount?: number;
  data: Record<string, unknown>;
  recipient_name?: string;
  bank_name?: string;
  error_message?: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// GET - Get user's pending transactions or latest one
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const latest = searchParams.get('latest') === 'true';
    const status = searchParams.get('status');

    let query = db
      .from('pending_transactions')
      .select('*')
      .eq('user_id', userId);

    if (reference) {
      query = query.eq('reference', reference);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (latest) {
      query = query
        .in('status', ['pending', 'processing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      logger.warn('Pending transactions table not found or error:', error);
      // Return empty data if table doesn't exist instead of failing
      if (latest) {
        return NextResponse.json({ ok: true, data: null });
      }
      return NextResponse.json({ ok: true, data: [] });
    }

    if (latest && data && data.length > 0) {
      return NextResponse.json({ ok: true, data: data[0] });
    }

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (error) {
    logger.error('Pending transactions GET error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new pending transaction
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, reference, amount, data, recipientName, bankName, expiresAt } = body;

    if (!type || !reference) {
      return NextResponse.json({ ok: false, message: 'Type and reference are required' }, { status: 400 });
    }

    const { data: existing } = await db
      .from('pending_transactions')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existing) {
      return NextResponse.json({ ok: false, message: 'Transaction reference already exists' }, { status: 400 });
    }

    const { data: inserted, error } = await db
      .from('pending_transactions')
      .insert({
        user_id: userId,
        type,
        reference,
        amount: amount ? Math.round(amount) : null,
        data: data || {},
        recipient_name: recipientName,
        bank_name: bankName,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating pending transaction:', error);
      return NextResponse.json({ ok: false, message: 'Failed to create transaction' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Transaction created', data: inserted });
  } catch (error) {
    logger.error('Pending transactions POST error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a pending transaction
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reference, status, data, errorMessage, completedAt, txId } = body;

    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Reference is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (errorMessage) updates.error_message = errorMessage;
    if (completedAt) updates.completed_at = completedAt;
    if (data) {
      const { data: existing } = await db
        .from('pending_transactions')
        .select('data')
        .eq('reference', reference)
        .eq('user_id', userId)
        .single();
      
      updates.data = { ...(existing?.data || {}), ...data, txId };
    }

    const { data: updated, error } = await db
      .from('pending_transactions')
      .update(updates)
      .eq('reference', reference)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating pending transaction:', error);
      return NextResponse.json({ ok: false, message: 'Failed to update transaction' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Transaction updated', data: updated });
  } catch (error) {
    logger.error('Pending transactions PATCH error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a pending transaction (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Reference is required' }, { status: 400 });
    }

    const { error } = await db
      .from('pending_transactions')
      .delete()
      .eq('reference', reference)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error deleting pending transaction:', error);
      return NextResponse.json({ ok: false, message: 'Failed to delete transaction' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Transaction deleted' });
  } catch (error) {
    logger.error('Pending transactions DELETE error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
