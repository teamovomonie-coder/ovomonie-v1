import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('id, bank_name, account_number, account_name, verified_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: cards, error: cardsError } = await supabase
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
