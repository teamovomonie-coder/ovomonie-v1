import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { createVFDVirtualCard } from '@/lib/vfd-virtual-card';
import { rateLimits } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

const CARD_FEE_KOBO = 100000; // ₦1000

const createCardSchema = z.object({
  cardName: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimits.financial(request, 'card-create');
    if (rateLimitResponse) return rateLimitResponse;

    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = createCardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request data' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, balance, kyc_tier')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.kyc_tier || user.kyc_tier < 2) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Complete KYC verification first',
        code: 'KYC_REQUIRED'
      }, { status: 403 });
    }

    const reference = `VCARD_${userId.substring(0, 8)}_${Date.now()}`;

    const { data: requestData, error: requestError } = await supabaseAdmin
      .rpc('create_virtual_card_request', {
        p_user_id: userId,
        p_reference: reference,
        p_card_fee_kobo: CARD_FEE_KOBO
      });

    if (requestError) {
      if (requestError.message?.includes('already has an active')) {
        return NextResponse.json({ ok: false, error: 'You already have an active virtual card', code: 'CARD_EXISTS' }, { status: 409 });
      }
      if (requestError.message?.includes('Insufficient balance')) {
        return NextResponse.json({ ok: false, error: `Insufficient balance. Card fee: ₦${CARD_FEE_KOBO / 100}`, code: 'INSUFFICIENT_BALANCE' }, { status: 400 });
      }
      if (requestError.message?.includes('Duplicate request')) {
        return NextResponse.json({ ok: false, error: 'Request already in progress', code: 'DUPLICATE_REQUEST' }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: 'Failed to process request' }, { status: 500 });
    }

    const requestId = requestData.request_id;
    logger.info('Card request created, funds locked', { userId, requestId, reference });

    const vfdResponse = await createVFDVirtualCard({
      userId,
      reference,
      customerName: validation.data.cardName || user.full_name || 'Cardholder',
      currency: 'NGN'
    });

    if (vfdResponse.success && vfdResponse.data) {
      const { error: completeError } = await supabaseAdmin
        .rpc('complete_virtual_card_creation', {
          p_request_id: requestId,
          p_vfd_card_id: vfdResponse.data.cardId,
          p_masked_pan: vfdResponse.data.maskedPan,
          p_expiry_month: vfdResponse.data.expiryMonth,
          p_expiry_year: vfdResponse.data.expiryYear,
          p_card_name: vfdResponse.data.cardName
        });

      if (completeError) {
        return NextResponse.json({ ok: false, error: 'Card created but failed to save. Contact support.' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: 'Virtual card created successfully',
        data: {
          cardId: vfdResponse.data.cardId,
          maskedPan: vfdResponse.data.maskedPan,
          expiryMonth: vfdResponse.data.expiryMonth,
          expiryYear: vfdResponse.data.expiryYear,
          status: 'active',
          newBalance: requestData.new_balance
        }
      });
    } else {
      await supabaseAdmin.rpc('refund_card_creation', {
        p_request_id: requestId,
        p_error_message: vfdResponse.error || 'VFD card creation failed'
      });

      return NextResponse.json({
        ok: false,
        error: vfdResponse.error || 'Failed to create virtual card',
        code: vfdResponse.code || 'VFD_ERROR'
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('Virtual card creation error', { error });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: cards, error } = await supabaseAdmin
      .from('virtual_cards')
      .select('id, masked_pan, expiry_month, expiry_year, card_name, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: 'Failed to fetch cards' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: cards || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
