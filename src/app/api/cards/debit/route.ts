import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdDebitCardService } from '@/lib/vfd-debitcard-service';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

const VIRTUAL_CARD_FEE = 1000_00; // ₦1,000 in kobo

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { action, cardType, deliveryAddress, cardId, reason } = await req.json();
    logger.info('Debit card operation', { userId, action, cardType, cardId });

    // Handle delete and block without user lookup
    if (action === 'delete') {
      if (!cardId) {
        return NextResponse.json({ ok: false, message: 'cardId is required' }, { status: 400 });
      }
      try {
        await supabaseAdmin
          .from('virtual_cards')
          .delete()
          .eq('vfd_card_id', cardId);
      } catch (e) {
        logger.warn('Failed to delete from DB', e);
      }
      return NextResponse.json({ ok: true, message: 'Card deleted successfully' });
    }

    if (action === 'block') {
      if (!cardId) {
        return NextResponse.json({ ok: false, message: 'cardId is required' }, { status: 400 });
      }
      try {
        await supabaseAdmin
          .from('virtual_cards')
          .update({ status: 'blocked' })
          .eq('vfd_card_id', cardId);
      } catch (e) {
        logger.warn('Failed to block in DB', e);
      }
      return NextResponse.json({ ok: true, message: 'Card blocked successfully' });
    }

    // Only lookup user for create operations
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('account_number, balance, transaction_pin')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .single();

    if (userError || !user) {
      logger.error('User not found for create operation', { userId, error: userError });
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (action === 'create') {
      if (!cardType || !['PHYSICAL', 'VIRTUAL'].includes(cardType)) {
        return NextResponse.json({ ok: false, message: 'Valid cardType required (PHYSICAL or VIRTUAL)' }, { status: 400 });
      }

      if (cardType === 'VIRTUAL') {
        const currentBalance = user.balance || 0;
        if (currentBalance < VIRTUAL_CARD_FEE) {
          return NextResponse.json({ 
            ok: false, 
            message: `Insufficient balance. You need at least ₦${VIRTUAL_CARD_FEE / 100}` 
          }, { status: 400 });
        }

        // Check for existing active cards
        const { data: existingCards } = await supabaseAdmin
          .from('virtual_cards')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (existingCards && existingCards.length > 0) {
          return NextResponse.json({ 
            ok: false, 
            message: 'You already have an active virtual card. Please delete your existing card first.' 
          }, { status: 400 });
        }

        // Create mock card
        const mockCardId = `MOCK-${Date.now()}`;
        const cardNumber = `4000${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const cvv = Math.floor(Math.random() * 900 + 100).toString();
        const expiryMonth = '12';
        const expiryYear = String(new Date().getFullYear() + 3).slice(-2);

        const { error: cardError } = await supabaseAdmin
          .from('virtual_cards')
          .insert({
            user_id: userId,
            vfd_card_id: mockCardId,
            masked_pan: cardNumber,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            card_name: 'Virtual Card',
            status: 'active'
          });

        if (cardError) {
          logger.error('Error creating virtual card:', cardError);
          return NextResponse.json({ ok: false, message: 'Failed to create virtual card' }, { status: 500 });
        }

        // Deduct fee
        await supabaseAdmin
          .from('users')
          .update({ balance: currentBalance - VIRTUAL_CARD_FEE })
          .eq('id', userId);

        return NextResponse.json({ 
          ok: true, 
          data: {
            cardId: mockCardId,
            cardNumber,
            cardType: 'VIRTUAL',
            status: 'ACTIVE',
            expiryDate: `${expiryMonth}/${expiryYear}`,
            cvv,
            balance: '0.00'
          }
        });
      }
    }

    return NextResponse.json({ ok: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Debit card operation error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'Card operation failed' },
      { status: 500 }
    );
  }
}
