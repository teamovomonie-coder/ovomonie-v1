import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { vfdCardService } from '@/lib/vfd-card-service';
import { transactionService, notificationService } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
        
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'initiate': {
        const { amount, reference, cardNumber, cardPin, cvv2, expiryDate, shouldTokenize } = data;

        if (!amount || !reference || !cardNumber || !cardPin || !cvv2 || !expiryDate) {
          return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
        }

        const existing = await transactionService.getByReference(reference);
        if (existing) {
          return NextResponse.json({ ok: false, message: 'Transaction already exists' }, { status: 400 });
        }

        const result = await vfdCardService.initiatePayment({
          amount: String(amount),
          reference,
          useExistingCard: false,
          cardNumber,
          cardPin,
          cvv2,
          expiryDate,
          shouldTokenize: shouldTokenize || false,
        });

        return NextResponse.json({ ok: true, data: result });
      }

      case 'authorize-otp': {
        const { reference, otp } = data;

        if (!reference || !otp) {
          return NextResponse.json({ ok: false, message: 'Reference and OTP required' }, { status: 400 });
        }

        const result = await vfdCardService.authorizeWithOTP(reference, otp);

        if (result.status === '00') {
          await transactionService.create({
            user_id: userId,
            reference,
            type: 'debit',
            amount: 0,
            narration: 'Card payment',
            party_name: "Transaction",
            balance_after: 0,
            status: "completed",
            metadata: { vfdReference: reference },
          });
        }

        return NextResponse.json({ ok: true, data: result });
      }

      case 'authorize-pin': {
        const { reference, pin } = data;

        if (!reference || !pin) {
          return NextResponse.json({ ok: false, message: 'Reference and PIN required' }, { status: 400 });
        }

        const result = await vfdCardService.authorizeWithPIN(reference, pin);

        if (result.status === '00') {
          await transactionService.create({
            user_id: userId,
            reference,
            type: 'debit',
            amount: 0,
            narration: 'Card payment',
            party_name: "Transaction",
            balance_after: 0,
            status: "completed",
            metadata: { vfdReference: reference },
          });
        }

        return NextResponse.json({ ok: true, data: result });
      }

      case 'status': {
        const { reference } = data;

        if (!reference) {
          return NextResponse.json({ ok: false, message: 'Reference required' }, { status: 400 });
        }

        const result = await vfdCardService.getPaymentDetails(reference);
        return NextResponse.json({ ok: true, data: result });
      }

      default:
        return NextResponse.json({ ok: false, message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Card payment error:', error);
    const message = error instanceof Error ? error.message : 'Payment failed';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
