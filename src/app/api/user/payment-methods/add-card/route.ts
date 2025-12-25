import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VFD_API_URL = process.env.VFD_API_URL || 'https://api-devapps.vfdbank.systems';
const VFD_API_KEY = process.env.VFD_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cardNumber, expiryDate, cvv, cardholderName } = body;

    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      return NextResponse.json(
        { message: 'All card details are required' },
        { status: 400 }
      );
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const cardType = getCardType(cleanCardNumber);

    // Validate card type for dev environment
    if (!['Verve', 'Mastercard', 'Visa'].includes(cardType)) {
      return NextResponse.json(
        { message: 'Only Verve, Mastercard, and Visa cards are supported in dev environment' },
        { status: 400 }
      );
    }

    // Skip VFD tokenization for now in dev mode
    const cardToken = `token_${Date.now()}`;

    // Save to Supabase
    const { data, error } = await supabase
      .from('bank_cards')
      .insert({
        user_id: userId,
        card_number: cleanCardNumber.slice(-4),
        card_type: cardType,
        expiry_date: expiryDate,
        cardholder_name: cardholderName,
        card_token: cardToken,
        is_active: true,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({
      message: 'Card linked successfully',
      card: data,
    });
  } catch (error) {
    console.error('Error adding card:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to add card' },
      { status: 500 }
    );
  }
}

function getCardType(cardNumber: string): string {
  const firstDigit = cardNumber[0];
  const firstTwoDigits = cardNumber.substring(0, 2);
  const firstFourDigits = cardNumber.substring(0, 4);

  if (firstDigit === '4') return 'Visa';
  if (['51', '52', '53', '54', '55'].includes(firstTwoDigits) || 
      (parseInt(firstFourDigits) >= 2221 && parseInt(firstFourDigits) <= 2720)) {
    return 'Mastercard';
  }
  if (['5060', '5061', '5078', '5079', '6500'].some(prefix => cardNumber.startsWith(prefix))) {
    return 'Verve';
  }
  return 'Unknown';
}
