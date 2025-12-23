import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { transactionService, notificationService, db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  processVFDInternalTransfer,
  processVFDDeposit,
  processVFDWithdrawal,
} from '@/lib/vfd-transactions';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { amount, reference, category, description, gateway = 'vfd', type } = body || {};

    if (!reference) return NextResponse.json({ ok: false, message: 'reference is required' }, { status: 400 });
    if (!amount || typeof amount !== 'number' || amount <= 0) return NextResponse.json({ ok: false, message: 'invalid amount' }, { status: 400 });

    logger.info(`[Payments] charge requested by ${userId} ref=${reference} amount=${amount}`);

    // Idempotency: if a financial transaction already exists for this reference, return it
    try {
      const { data: existingFin } = await db.from('financial_transactions').select('id').eq('reference', reference).limit(1).maybeSingle();
      if (existingFin && existingFin.id) {
        return NextResponse.json({ ok: true, transaction_id: existingFin.id });
      }
    } catch (e) {
      logger.debug('Idempotency check failed (non-fatal)', e);
    }

    // Create pending transaction record (middleware responsibility)
    let pendingId: string | null = null;
    try {
      const { data: pendingExisting } = await db.from('pending_transactions').select('id,status').eq('reference', reference).limit(1).maybeSingle();
      if (pendingExisting && pendingExisting.id) {
        pendingId = pendingExisting.id;
      } else {
        const { data: inserted } = await db.from('pending_transactions').insert({
          user_id: userId,
          type: category || 'payment',
          status: 'pending',
          reference,
          amount: Math.round(amount),
          data: body || {},
          recipient_name: body.recipientName || null,
          bank_name: body.bankName || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).select().single();

        pendingId = (inserted as any)?.id || null;
      }
    } catch (e) {
      logger.warn('Failed to create pending transaction (non-fatal)', e);
    }

    // Default result structure
    let paymentResult: { success: boolean; transactionId?: string; message?: string; amount?: number } = { success: false, message: 'Not executed' };

    // If gateway is VFD attempt immediate processing using helpers (best-effort)
    if (gateway === 'vfd') {
      try {
        // Determine operation by fields present
        if (body.recipientPhone) {
          // internal transfer
          paymentResult = await processVFDInternalTransfer(
            body.senderPhone || '',
            body.senderPin || '',
            body.recipientPhone,
            amount,
            reference,
            description || 'transfer'
          );
        } else if (type === 'deposit' || body.cardDetails || body.paymentMethod === 'card') {
          paymentResult = await processVFDDeposit(
            body.userPhone || body.senderPhone || '',
            body.userPin || body.senderPin || '',
            amount,
            reference,
            body.paymentMethod || 'card',
            body.cardDetails
          );
        } else if (type === 'withdrawal' || body.withdraw) {
          paymentResult = await processVFDWithdrawal(
            body.userPhone || body.senderPhone || '',
            body.userPin || body.senderPin || '',
            body.transactionPin || '',
            amount,
            reference,
            body.bankAccountNumber
          );
        } else {
          // fallback: attempt deposit
          paymentResult = await processVFDDeposit(
            body.userPhone || body.senderPhone || '',
            body.userPin || body.senderPin || '',
            amount,
            reference,
            body.paymentMethod || 'card',
            body.cardDetails
          );
        }
      } catch (err) {
        logger.error('[Payments] VFD processing error', err);
        paymentResult = { success: false, message: err instanceof Error ? err.message : 'VFD processing failed' };
      }
    } else {
      // Other gateways could be supported here. For now simulate success for non-VFD (idempotent guarded by reference)
      paymentResult = { success: true, transactionId: `sim-${Date.now()}`, message: 'Simulated success', amount };
    }

    if (!paymentResult.success) {
      // update pending to failed if we created one
      try {
        if (pendingId) await db.from('pending_transactions').update({ status: 'failed', error_message: paymentResult.message || 'Payment failed', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() }).eq('id', pendingId);
      } catch (e) {
        logger.debug('Failed to mark pending as failed (non-fatal)', e);
      }
      return NextResponse.json({ ok: false, message: paymentResult.message || 'Payment failed' }, { status: 400 });
    }

    // Create financial transaction record in DB
    try {
      const txId = await transactionService.create({
        user_id: userId,
        category: category || 'payment',
        type: 'debit',
        amount: Math.round(amount),
        reference,
        narration: description || `${category || 'payment'}`,
        party_name: body.recipientName || body.partyName || null,
        party_account: body.recipientAccount || body.partyAccount || null,
        // balance_after intentionally omitted here; compute and set elsewhere if needed
        created_at: new Date().toISOString(),
      });

      // update pending transaction to completed + attach transaction id
      try {
        if (pendingId) await db.from('pending_transactions').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), data: { ...(body || {}), transactionId: txId } }).eq('id', pendingId);
      } catch (e) {
        logger.warn('Failed to update pending transaction after success (non-fatal)', e);
      }

      // Send notification asynchronously (best-effort)
      (async () => {
        try {
          await notificationService.create({
            user_id: userId,
            title: 'Payment successful',
            body: `${category || 'Payment'} of ₦${amount.toLocaleString()} successful. Ref: ${reference}`,
            category: 'payment',
            type: 'receipt',
            amount: Math.round(amount),
            reference,
            recipient_name: body.recipientName || body.partyName || null,
            created_at: new Date().toISOString(),
          } as any);
        } catch (e) {
          logger.warn('Failed to create notification (non-fatal)', e);
        }
      })();

      return NextResponse.json({ ok: true, transaction_id: txId, vfd: paymentResult.transactionId || null });
    } catch (err) {
      logger.error('Failed to create financial transaction record', err);
      // Mark pending as failed
      try {
        if (pendingId) await db.from('pending_transactions').update({ status: 'failed', error_message: 'Failed to record transaction', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() }).eq('id', pendingId);
      } catch (e) {
        logger.debug('Failed to mark pending as failed after db error (non-fatal)', e);
      }
      return NextResponse.json({ ok: false, message: 'Failed to record transaction' }, { status: 500 });
    }
  } catch (err) {
    logger.error('POST /api/payments/charge error', err);
    return NextResponse.json({ ok: false, message: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
