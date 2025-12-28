import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const reqHeaders = req.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('bank_accounts')
      .select('id, bank_name, account_number, account_name, verified_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: cards, error: cardsError } = await supabaseAdmin
      .from('bank_cards')
      .select('id, card_number, card_type, expiry_date, cardholder_name, verified_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (accountsError || cardsError) {
      console.error('Supabase errors:', { accountsError, cardsError });
      throw new Error('Failed to fetch payment methods');
    }

    return NextResponse.json({
      accounts: (accounts || []).map(acc => ({
        id: acc.id,
        bankName: acc.bank_name,
        accountNumber: acc.account_number,
        accountName: acc.account_name
      })),
      cards: (cards || []).map(card => ({
        id: card.id,
        cardNumber: card.card_number,
        cardType: card.card_type,
        expiryDate: card.expiry_date,
        cardholderName: card.cardholder_name
      }))
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
