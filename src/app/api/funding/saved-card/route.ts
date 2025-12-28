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
    const { cardId, amount } = body;

    if (!cardId || !amount || amount < 100) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // Get saved card details
    const { data: card, error: cardError } = await supabaseAdmin
      .from('saved_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ message: 'Card not found' }, { status: 404 });
    }

    // Get user's current balance
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('wallet_balance_kobo')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newBalance = (user.wallet_balance_kobo || 0) + (amount * 100);

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ wallet_balance_kobo: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      type: 'credit',
      amount_kobo: amount * 100,
      description: `Wallet funding via saved card ending in ${card.last4}`,
      status: 'completed',
      reference: `saved-card-${Date.now()}`
    });

    return NextResponse.json({
      success: true,
      newBalanceInKobo: newBalance,
      message: 'Wallet funded successfully'
    });
  } catch (error) {
    logger.error('Error funding with saved card:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
