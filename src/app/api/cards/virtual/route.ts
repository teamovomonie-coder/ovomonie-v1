import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

const VIRTUAL_CARD_FEE = 1000_00; // ₦1,000 in kobo

function generateMaskedPAN(): string {
  const prefix = '4000';
  const middle = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  const lastFour = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${middle}${lastFour}`;
}

function generateCVV(): string {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateExpiryDate(): { month: string; year: string } {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear() + 3).slice(-2); // 3 years from now
  return { month, year };
}

// GET - Fetch user's virtual cards
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: cards, error } = await supabaseAdmin
      .from('virtual_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching virtual cards:', error);
      return NextResponse.json({ message: 'Failed to fetch virtual cards' }, { status: 500 });
    }

    const transformedCards = (cards || []).map(card => ({
      id: card.id,
      cardNumber: card.masked_pan,
      expiryDate: `${card.expiry_month}/${card.expiry_year}`,
      cvv: generateCVV(), // Generate CVV for display
      isActive: card.status === 'active',
      balance: 0,
      createdAt: card.created_at,
      expiresAt: new Date(`20${card.expiry_year}-${card.expiry_month}-01`),
      isVFDCard: true,
      status: card.status
    }));

    return NextResponse.json({ success: true, cards: transformedCards });
  } catch (error) {
    logger.error('Virtual cards fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new virtual card
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentBalance = userData.balance || 0;
    if (currentBalance < VIRTUAL_CARD_FEE) {
      return NextResponse.json(
        { message: `Insufficient balance. You need at least ₦${VIRTUAL_CARD_FEE / 100}` },
        { status: 400 }
      );
    }

    // Check if user already has an active virtual card
    const { data: existingCard } = await supabaseAdmin
      .from('virtual_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingCard) {
      return NextResponse.json(
        { message: 'You already have an active virtual card' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - VIRTUAL_CARD_FEE;
    const fullCardNumber = generateMaskedPAN();
    const cvv = generateCVV();
    const { month, year } = generateExpiryDate();
    const vfdCardId = `VFD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create card request
    const { data: cardRequest, error: requestError } = await supabaseAdmin
      .from('card_requests')
      .insert({
        user_id: userId,
        card_type: 'VIRTUAL',
        status: 'completed',
        request_data: { fee: VIRTUAL_CARD_FEE }
      })
      .select()
      .single();

    if (requestError) {
      logger.error('Error creating card request:', requestError);
      return NextResponse.json({ message: 'Failed to create card request' }, { status: 500 });
    }

    // Create virtual card
    const { data: cardData, error: cardError } = await supabaseAdmin
      .from('virtual_cards')
      .insert({
        user_id: userId,
        vfd_card_id: vfdCardId,
        masked_pan: fullCardNumber,
        expiry_month: month,
        expiry_year: year,
        card_name: 'Virtual Card',
        status: 'active',
        request_id: cardRequest.id
      })
      .select()
      .single();

    if (cardError) {
      logger.error('Error creating virtual card:', cardError);
      return NextResponse.json({ message: 'Failed to create virtual card' }, { status: 500 });
    }

    // Update user balance
    const { error: balanceError } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      logger.error('Error updating balance:', balanceError);
      return NextResponse.json({ message: 'Failed to update balance' }, { status: 500 });
    }

    logger.info(`Virtual card created for user ${userId}`, { cardId: cardData.id });

    return NextResponse.json({
      success: true,
      data: {
        cardId: cardData.id,
        cardNumber: fullCardNumber,
        expiryDate: `${month}/${year}`,
        cvv: cvv,
        status: 'ACTIVE'
      },
      newBalanceInKobo: newBalance,
      message: 'Virtual card created successfully'
    });
  } catch (error) {
    logger.error('Virtual card creation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
