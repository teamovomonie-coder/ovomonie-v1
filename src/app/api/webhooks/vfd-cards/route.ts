import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { createHmac } from 'crypto';

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.VFD_WEBHOOK_SECRET || process.env.AUTH_SECRET || '';
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-vfd-signature') || '';
    const payload = await request.text();
    
    if (!verifyWebhookSignature(payload, signature)) {
      logger.warn('Invalid webhook signature');
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(payload);
    logger.info('VFD webhook received', { event: event.type, reference: event.reference });

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 503 });
    }

    switch (event.type) {
      case 'virtual_card.created':
      case 'virtual_card.activated': {
        const { data: card } = await supabaseAdmin
          .from('virtual_cards')
          .select('id')
          .eq('vfd_card_id', event.data.cardId)
          .single();

        if (card) {
          await supabaseAdmin
            .from('virtual_cards')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', card.id);
          
          logger.info('Card activated via webhook', { cardId: event.data.cardId });
        }
        break;
      }

      case 'virtual_card.failed': {
        const { data: request } = await supabaseAdmin
          .from('card_requests')
          .select('id, user_id')
          .eq('reference', event.reference)
          .single();

        if (request && request.id) {
          await supabaseAdmin.rpc('refund_card_creation', {
            p_request_id: request.id,
            p_error_message: event.data.error || 'Card creation failed'
          });

          logger.info('Card creation failed, refunded via webhook', { reference: event.reference });
        }
        break;
      }

      case 'virtual_card.blocked': {
        const { data: card } = await supabaseAdmin
          .from('virtual_cards')
          .select('id')
          .eq('vfd_card_id', event.data.cardId)
          .single();

        if (card) {
          await supabaseAdmin
            .from('virtual_cards')
            .update({ status: 'blocked', updated_at: new Date().toISOString() })
            .eq('id', card.id);

          logger.info('Card blocked via webhook', { cardId: event.data.cardId });
        }
        break;
      }

      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    logger.error('Webhook processing error', { error });
    return NextResponse.json({ ok: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}
