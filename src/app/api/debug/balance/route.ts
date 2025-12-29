import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, phone, account_number, balance, updated_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 });
    }

    const { data: transactions } = await supabaseAdmin
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        phone: user.phone,
        accountNumber: user.account_number,
        balanceInKobo: user.balance,
        balanceInNaira: (user.balance / 100).toFixed(2),
        updatedAt: user.updated_at,
      },
      recentTransactions: transactions?.map(tx => ({
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        amountInNaira: (tx.amount / 100).toFixed(2),
        reference: tx.reference,
        timestamp: tx.timestamp,
      })) || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Debug balance error', { error });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
