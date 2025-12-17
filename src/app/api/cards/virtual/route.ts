import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VIRTUAL_CARD_FEE = 1000_00; // ₦1,000 in kobo
const CARD_VALIDITY_YEARS = 1;

function generateCardNumber(): string {
  // Generate a 16-digit card number (4000-5999 range for Visa test cards)
  const prefix = '4000';
  const randomDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
  return prefix + randomDigits;
}

function generateCVV(): string {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateExpiryDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear() + CARD_VALIDITY_YEARS).slice(-2);
  return `${month}/${year}`;
}

// GET - Fetch user's virtual cards
export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header missing.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    const userId = decoded.sub;

    // Fetch virtual cards from Supabase
    const { data: cards, error } = await supabase
      .from('users_virtual_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching virtual cards:', error);
      return NextResponse.json(
        { message: 'Failed to fetch virtual cards.' },
        { status: 500 }
      );
    }

    // Transform to match frontend expectations
    const transformedCards = (cards || []).map(card => ({
      id: card.id,
      cardNumber: card.card_number,
      expiryDate: card.expiry_date,
      cvv: card.cvv,
      isActive: card.is_active,
      balance: card.balance,
      cardType: card.card_type,
      createdAt: card.created_at,
      expiresAt: card.expires_at,
    }));

    return NextResponse.json({
      success: true,
      cards: transformedCards,
    });
  } catch (error) {
    logger.error('Virtual cards fetch error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching virtual cards.' },
      { status: 500 }
    );
  }
}

// POST - Create a new virtual card
export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header missing.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    const userId = decoded.sub;

    const { clientReference } = await request.json();

    // Get user data from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, balance, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      logger.error('User not found:', userError);
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const currentBalance = userData.balance || 0;

    // Check if user has sufficient balance
    if (currentBalance < VIRTUAL_CARD_FEE) {
      return NextResponse.json(
        { message: `Insufficient balance. You need at least ₦${VIRTUAL_CARD_FEE / 100} to create a virtual card.` },
        { status: 400 }
      );
    }

    // Deduct fee
    const newBalance = currentBalance - VIRTUAL_CARD_FEE;

    // Generate card details
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const expiryDate = generateExpiryDate();
    const expiresAt = new Date(Date.now() + CARD_VALIDITY_YEARS * 365 * 24 * 60 * 60 * 1000);

    // Create virtual card record in Supabase
    const { data: cardData, error: cardError } = await supabase
      .from('users_virtual_cards')
      .insert({
        user_id: userId,
        card_number: cardNumber,
        expiry_date: expiryDate,
        cvv: cvv,
        balance: newBalance, // Virtual card reflects wallet balance
        is_active: true,
        card_type: 'visa',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (cardError) {
      logger.error('Error creating virtual card:', cardError);
      return NextResponse.json(
        { message: 'Failed to create virtual card.' },
        { status: 500 }
      );
    }

    // Update user balance in Supabase
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      // Rollback: delete the card if balance update fails
      await supabase.from('users_virtual_cards').delete().eq('id', cardData.id);
      logger.error('Error updating balance:', balanceError);
      return NextResponse.json(
        { message: 'Failed to update balance.' },
        { status: 500 }
      );
    }

    // Record the transaction
    await supabase.from('financial_transactions').insert({
      user_id: userId,
      type: 'debit',
      category: 'virtual_card',
      amount: VIRTUAL_CARD_FEE,
      balance_after: newBalance,
      reference: clientReference || `vc-${cardData.id}`,
      description: 'Virtual card creation fee',
      status: 'completed',
      metadata: { cardId: cardData.id },
    });

    logger.info(`Virtual card created for user ${userId}`, {
      cardId: cardData.id,
      fee: VIRTUAL_CARD_FEE,
      clientReference,
    });

    return NextResponse.json({
      success: true,
      cardId: cardData.id,
      cardNumber,
      expiryDate,
      cvv,
      newBalanceInKobo: newBalance,
      message: 'Virtual card created successfully.',
    });
  } catch (error) {
    logger.error('Virtual card creation error:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating the virtual card.' },
      { status: 500 }
    );
  }
}
