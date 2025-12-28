import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { paymentId, paymentType, amount } = body;

    if (!paymentId || !paymentType || !amount || amount < 100) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    let paymentMethod;
    if (paymentType === 'card') {
      const { data: card, error: cardError } = await supabaseAdmin
        .from('bank_cards')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userId)
        .single();

      if (cardError || !card) {
        return NextResponse.json({ message: 'Card not found' }, { status: 404 });
      }
      paymentMethod = `card ending in ${card.card_number.slice(-4)}`;
    } else if (paymentType === 'account') {
      const { data: account, error: accountError } = await supabaseAdmin
        .from('bank_accounts')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return NextResponse.json({ message: 'Bank account not found' }, { status: 404 });
      }
      paymentMethod = `${account.bank_name} account ${account.account_number}`;
    } else {
      return NextResponse.json({ message: 'Invalid payment type' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('wallet_balance_kobo')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newBalance = (user.wallet_balance_kobo || 0) + (amount * 100);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ wallet_balance_kobo: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      type: 'credit',
      amount_kobo: amount * 100,
      description: `Wallet funding via ${paymentMethod}`,
      status: 'completed',
      reference: `saved-payment-${Date.now()}`
    });

    return NextResponse.json({
      success: true,
      newBalanceInKobo: newBalance,
      message: 'Wallet funded successfully'
    });
  } catch (error) {
    logger.error('Error funding with saved payment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
