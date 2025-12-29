import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', params.id)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Format transaction data for receipt
    const receiptData = {
      type: transaction.category || 'airtime',
      network: transaction.metadata?.network || transaction.party_name,
      phoneNumber: transaction.metadata?.phoneNumber || transaction.party_biller_id,
      amount: Math.abs(transaction.amount_in_kobo) / 100,
      planName: transaction.metadata?.planName,
      transactionId: transaction.transaction_id,
      completedAt: transaction.created_at
    };

    return NextResponse.json(receiptData);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}