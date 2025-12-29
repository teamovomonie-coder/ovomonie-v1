import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { initiateCardPayment } from '@/lib/vfd';
import { userService, transactionService, notificationService } from '@/lib/db';
import { executeVFDTransaction } from '@/lib/balance-sync';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        
        let userId: string | null = null;
        try {
            userId = getUserIdFromToken(reqHeaders);
        } catch (authError) {
            logger.error('Auth error in funding/card', { error: authError });
            return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
        }
        
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { amount, reference, cardNumber, cardPin, cvv2, expiryDate, shouldTokenize } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
        }
        if (!reference) {
            return NextResponse.json({ message: 'Reference is required for this transaction.' }, { status: 400 });
        }

        // Idempotency check
        const existing = await transactionService.getByReference(reference);
        if (existing) {
            const user = await userService.getById(userId);
            return NextResponse.json({ 
                message: 'Transaction already processed', 
                newBalanceInKobo: user?.balance ?? 0,
                requiresOTP: false 
            }, { status: 200 });
        }

        const amountInKobo = Math.round(amount * 100);

        if (!cardNumber || !cardPin || !cvv2 || !expiryDate) {
            logger.error('Missing card details', { hasCardNumber: !!cardNumber, hasPin: !!cardPin, hasCvv: !!cvv2, hasExpiry: !!expiryDate });
            return NextResponse.json({ message: 'Card details (number, pin, cvv, expiry) are required.' }, { status: 400 });
        }

        // Create pending payment record
        if (supabaseAdmin) {
            const { error: pendingError } = await supabaseAdmin.from('pending_payments').insert({
                user_id: userId,
                amount: amountInKobo,
                reference: reference,
                status: 'pending',
                payment_method: 'card',
                metadata: { cardLast4: cardNumber.slice(-4) },
            });
            
            if (pendingError) {
                logger.error('Failed to create pending payment', { error: pendingError, reference });
            }
        }
        
        logger.info('Processing card payment', { amount, reference, cardLast4: cardNumber.slice(-4) });
        
        const initiation = await initiateCardPayment({
            amount: Math.round(amount),
            reference,
            cardNumber,
            cardPin,
            cvv2,
            expiryDate,
            shouldTokenize: shouldTokenize || false,
        });

        logger.debug('VFD initiation response', { status: initiation.status, ok: initiation.ok });

        if (!initiation.ok) {
            const errorMsg = initiation.data?.message || initiation.data?.vfdError || 'Payment initiation failed';
            logger.error('VFD initiation failed', { 
                status: initiation.status, 
                message: errorMsg,
                vfdError: initiation.data?.vfdError,
            });
            
            // Update pending payment status
            if (supabaseAdmin) {
                await supabaseAdmin.from('pending_payments')
                    .update({ status: 'failed', error_message: errorMsg })
                    .eq('reference', reference);
            }
            
            return NextResponse.json({ 
                message: errorMsg,
                requiresOTP: false
            }, { status: 400 });
        }

        const responseData = initiation.data?.data || initiation.data;
        const serviceCode = responseData?.serviceResponseCodes || responseData?.status;

        // Check if payment completed immediately
        if (serviceCode === 'COMPLETED' || serviceCode === '00') {
            const user = await userService.getById(userId);
            
            const newBalance = await executeVFDTransaction(
                userId,
                user?.account_number || '',
                async () => {},
                amountInKobo,
                'credit'
            );

            await transactionService.create({
                user_id: userId,
                type: 'credit',
                category: 'deposit',
                amount: amountInKobo,
                reference,
                narration: 'Card deposit via VFD',
                party_name: 'VFD Card',
                balance_after: newBalance,
            });

            await notificationService.create({
                user_id: userId,
                title: 'Wallet Funded',
                body: `You successfully added ₦${(amountInKobo / 100).toLocaleString()} to your wallet.`,
                category: 'transaction',
                type: 'credit',
                amount: amountInKobo,
                reference,
            });

            if (supabaseAdmin) {
                await supabaseAdmin.from('pending_payments').delete().eq('reference', reference);
            }

            return NextResponse.json({ 
                message: 'Payment completed successfully', 
                newBalanceInKobo: newBalance,
                requiresOTP: false,
                reference
            }, { status: 200 });
        }

        // Check if OTP is required
        if (serviceCode === 'OTP_REQUIRED' || responseData?.requiresOTP || responseData?.narration?.toLowerCase().includes('otp')) {
            logger.info('Payment requires OTP', { reference });
            return NextResponse.json({ 
                message: 'OTP required for authorization',
                requiresOTP: true,
                reference,
                vfdReference: responseData?.reference || reference
            }, { status: 200 });
        }

        // Handle other cases
        logger.info('Payment requires further action', { serviceCode, reference });
        return NextResponse.json({ 
            message: responseData?.narration || 'Payment initiated, awaiting confirmation',
            requiresOTP: false,
            reference,
            status: serviceCode
        }, { status: 200 });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('funding/card error', { message: errorMessage, error: err });
        
        return NextResponse.json({ 
            message: errorMessage || 'An internal server error occurred.',
            requiresOTP: false
        }, { status: 500 });
    }
}
