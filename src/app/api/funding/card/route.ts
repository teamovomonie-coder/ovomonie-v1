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
        const { amount, clientReference, cardNumber, cardPin, cvv, expiry } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        // Idempotency
        const existing = await transactionService.getByReference(clientReference);
        if (existing) {
                const user = await userService.getById(userId);
                return NextResponse.json({ message: 'Already processed', newBalanceInKobo: user?.balance ?? 0 }, { status: 200 });
            }

        const amountInKobo = Math.round(amount * 100);

        if (!cardNumber || !cardPin || !cvv || !expiry) {
            logger.error('Missing card details', { hasCardNumber: !!cardNumber, hasPin: !!cardPin, hasCvv: !!cvv, hasExpiry: !!expiry });
            return NextResponse.json({ message: 'Card details (number, pin, cvv, expiry) are required for card funding.' }, { status: 400 });
        }

        // Create pending payment record
        if (supabaseAdmin) {
            const { error: pendingError } = await supabaseAdmin.from('pending_payments').insert({
                user_id: userId,
                amount: amountInKobo,
                reference: clientReference,
                status: 'pending',
                payment_method: 'card',
                metadata: { cardLast4: cardNumber.slice(-4) },
            });
            
            if (pendingError) {
                logger.error('Failed to create pending payment', { error: pendingError, reference: clientReference });
            } else {
                logger.info('Created pending payment', { reference: clientReference, amount: amountInKobo });
            }
        } else {
            logger.warn('supabaseAdmin not available, skipping pending_payments insert');
        }

        // Convert MM/YY to YYMM for VFD
        let expiryYyMm = expiry;
        if (expiry.includes('/')) {
            const [mm, yy] = expiry.split('/');
            expiryYyMm = `${yy}${mm}`;
        }
        
        logger.info('Processing card payment', { amount, amountInKobo, reference: clientReference, expiryFormat: expiryYyMm });

        logger.info('Card payment request', { amount, reference: clientReference, cardNumberMasked: cardNumber.slice(-4), expiryYyMm });
        
        const initiation = await initiateCardPayment({
            amount: Math.round(amount),
            reference: clientReference,
            cardNumber,
            cardPin,
            cvv2: cvv,
            expiryDate: expiryYyMm,
            shouldTokenize: false,
        });

        logger.debug('VFD initiation', { initiation });

        if (!initiation.ok) {
            logger.error('VFD initiation failed', { 
                status: initiation.status, 
                message: initiation.data?.message,
                vfdError: initiation.data?.vfdError,
                vfdCode: initiation.data?.vfdCode,
                fullResponse: initiation.data 
            });
            return NextResponse.json({ 
                ok: false,
                message: initiation.data?.message || 'Failed to authenticate with payment gateway',
                details: initiation.data 
            }, { status: initiation.status || 500 });
        }

        if (initiation.ok && initiation.data && initiation.data.data && initiation.data.data.serviceResponseCodes === 'COMPLETED') {
            // Get user
            const user = await userService.getById(userId);
            
            // Execute VFD transaction and update balance
            const newBalance = await executeVFDTransaction(
                userId,
                user?.account_number || '',
                async () => {}, // VFD already processed
                amountInKobo,
                'credit'
            );

            // Log transaction
            const transaction = await transactionService.create({
                user_id: userId,
                type: 'credit',
                category: 'deposit',
                amount: amountInKobo,
                reference: clientReference,
                narration: 'Card deposit via VFD',
                party_name: 'VFD Card',
                balance_after: newBalance,
            });

            // Create notification
            await notificationService.create({
                user_id: userId,
                title: 'Wallet Funded',
                body: `You successfully added ₦${(amountInKobo / 100).toLocaleString()} to your wallet via card.`,
                category: 'transaction',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
            });

            // Remove from pending_payments (completed)
            if (supabaseAdmin) {
                const { error: deleteError } = await supabaseAdmin.from('pending_payments')
                    .delete()
                    .eq('reference', clientReference);
                
                if (deleteError) {
                    logger.error('Failed to delete pending payment', { error: deleteError, reference: clientReference });
                } else {
                    logger.info('Deleted pending payment', { reference: clientReference });
                }
            }

            return NextResponse.json({ ok: true, message: 'Funding successful!', newBalanceInKobo: newBalance, vfd: initiation.data }, { status: 200 });
        }

        // Handle 3DS or other actions required
        logger.info('VFD requires further action', { 
            code: initiation.data?.data?.code, 
            narration: initiation.data?.data?.narration,
            serviceResponseCodes: initiation.data?.data?.serviceResponseCodes 
        });
        return NextResponse.json({ 
            ok: true,
            message: initiation.data?.data?.narration || 'VFD initiation requires further action', 
            vfd: initiation.data || initiation,
            requiresAction: true,
            redirectUrl: initiation.data?.data?.redirectHtml
        }, { status: 200 });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorStack = err instanceof Error ? err.stack : undefined;
        
        logger.error('funding/card error', { 
            message: errorMessage,
            stack: errorStack,
            errorType: err?.constructor?.name,
            error: err
        });
        
        console.error('Card funding error:', err);
        
        return NextResponse.json({ 
            ok: false,
            message: errorMessage || 'An internal server error occurred.',
            details: process.env.NODE_ENV === 'development' ? { message: errorMessage, stack: errorStack } : undefined
        }, { status: 500 });
    }
}
