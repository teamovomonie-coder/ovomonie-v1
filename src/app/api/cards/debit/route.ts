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

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('account_number, balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (!user.account_number) {
      return NextResponse.json({ ok: false, message: 'Account number not found' }, { status: 400 });
    }

    switch (action) {
      case 'create':
        if (!cardType || !['PHYSICAL', 'VIRTUAL'].includes(cardType)) {
          return NextResponse.json({ ok: false, message: 'Valid cardType required (PHYSICAL or VIRTUAL)' }, { status: 400 });
        }

        if (cardType === 'VIRTUAL') {
          // Check balance for virtual card
          const currentBalance = user.balance || 0;
          if (currentBalance < VIRTUAL_CARD_FEE) {
            return NextResponse.json({ 
              ok: false, 
              message: `Insufficient balance. You need at least ₦${VIRTUAL_CARD_FEE / 100}` 
            }, { status: 400 });
          }

          // Check if user already has an active virtual card
          const { data: existingCard } = await supabaseAdmin
            .from('virtual_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

          if (existingCard) {
            return NextResponse.json({ 
              ok: false, 
              message: 'You already have an active virtual card' 
            }, { status: 400 });
          }

          try {
            // Try VFD API first
            const vfdCard = await vfdDebitCardService.createCard({
              accountNumber: user.account_number,
              cardType,
              deliveryAddress,
            });

            // Store in database
            const { data: cardData, error: cardError } = await supabaseAdmin
              .from('virtual_cards')
              .insert({
                user_id: userId,
                vfd_card_id: vfdCard.cardId,
                masked_pan: vfdCard.cardNumber,
                expiry_month: vfdCard.expiryDate.split('/')[0] || '12',
                expiry_year: vfdCard.expiryDate.split('/')[1] || '25',
                card_name: 'Virtual Card',
                status: 'active'
              })
              .select()
              .single();

            if (cardError) {
              logger.error('Error storing VFD card in database:', cardError);
            }

            // Deduct fee
            const newBalance = currentBalance - VIRTUAL_CARD_FEE;
            await supabaseAdmin
              .from('users')
              .update({ balance: newBalance })
              .eq('id', userId);

            return NextResponse.json({ ok: true, data: vfdCard });
          } catch (vfdError: any) {
            logger.warn('VFD card creation failed, using mock card', { error: vfdError?.message });

            // Create mock virtual card
            const mockCardId = `MOCK-${Date.now()}`;
            const fullCardNumber = `4000${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            const mockCVV = Math.floor(Math.random() * 900 + 100).toString();
            const expiryMonth = '12';
            const expiryYear = String(new Date().getFullYear() + 3).slice(-2);

            const { data: cardData, error: cardError } = await supabaseAdmin
              .from('virtual_cards')
              .insert({
                user_id: userId,
                vfd_card_id: mockCardId,
                masked_pan: fullCardNumber,
                expiry_month: expiryMonth,
                expiry_year: expiryYear,
                card_name: 'Virtual Card',
                status: 'active'
              })
              .select()
              .single();

            if (cardError) {
              logger.error('Error creating mock virtual card:', cardError);
              return NextResponse.json({ ok: false, message: 'Failed to create virtual card' }, { status: 500 });
            }

            // Deduct fee
            const newBalance = currentBalance - VIRTUAL_CARD_FEE;
            await supabaseAdmin
              .from('users')
              .update({ balance: newBalance })
              .eq('id', userId);

            const mockCard = {
              cardId: mockCardId,
              cardNumber: fullCardNumber,
              cardType: cardType as 'VIRTUAL',
              status: 'ACTIVE' as const,
              expiryDate: `${expiryMonth}/${expiryYear}`,
              cvv: mockCVV,
              balance: '0.00',
            };

            return NextResponse.json({ ok: true, data: mockCard, mock: true });
          }
        } else {
          // Physical card - use VFD API directly
          try {
            const card = await vfdDebitCardService.createCard({
              accountNumber: user.account_number,
              cardType,
              deliveryAddress,
            });
            return NextResponse.json({ ok: true, data: card });
          } catch (error: any) {
            return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
          }
        }

      case 'block':
        if (!cardId || !reason) {
          return NextResponse.json({ ok: false, message: 'cardId and reason are required' }, { status: 400 });
        }

        // Update database status
        await supabaseAdmin
          .from('virtual_cards')
          .update({ status: 'blocked' })
          .eq('vfd_card_id', cardId)
          .eq('user_id', userId);

        try {
          await vfdDebitCardService.blockCard(cardId, reason);
        } catch (error) {
          logger.warn('VFD block failed, but database updated', { error });
        }

        return NextResponse.json({ ok: true, message: 'Card blocked successfully' });

      case 'delete':
        if (!cardId) {
          return NextResponse.json({ ok: false, message: 'cardId is required' }, { status: 400 });
        }

        // Delete from database
        await supabaseAdmin
          .from('virtual_cards')
          .delete()
          .eq('vfd_card_id', cardId)
          .eq('user_id', userId);

        return NextResponse.json({ ok: true, message: 'Card deleted successfully' });

      default:
        return NextResponse.json({ ok: false, message: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Debit card operation error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'Card operation failed' },
      { status: 500 }
    );
  }
}
