import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { initiateCardPayment } from '@/lib/vfd';
import { userService, transactionService } from '@/lib/db';
import { executeVFDTransaction } from '@/lib/balance-sync';

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
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
            return NextResponse.json({ message: 'Already processed', newBalanceInKobo: user.balance }, { status: 200 });
        }

        const amountInKobo = Math.round(amount * 100);

        if (!cardNumber || !cardPin || !cvv || !expiry) {
            logger.error('Missing card details', { hasCardNumber: !!cardNumber, hasPin: !!cardPin, hasCvv: !!cvv, hasExpiry: !!expiry });
            return NextResponse.json({ message: 'Card details (number, pin, cvv, expiry) are required for card funding.' }, { status: 400 });
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

        if (initiation.ok && initiation.data && initiation.data.data && initiation.data.data.serviceResponseCodes === 'COMPLETED') {
            // Get user
            const user = await userService.getById(userId);
            
            // Execute VFD transaction and update balance
            const newBalance = await executeVFDTransaction(
                userId,
                user.accountNumber,
                async () => {}, // VFD already processed
                amountInKobo,
                'credit'
            );

            // Log transaction
            await transactionService.create({
                user_id: userId,
                type: 'credit',
                category: 'deposit',
                amount: amountInKobo,
                reference: clientReference,
                narration: 'Card deposit via VFD',
                party: { name: 'VFD Card' },
                balance_after: newBalance,
            });

            return NextResponse.json({ message: 'Funding successful!', newBalanceInKobo: newBalance, vfd: initiation.data }, { status: 200 });
        }

        // Handle 3DS or other actions required
        logger.info('VFD requires further action', { code: initiation.data?.data?.code, narration: initiation.data?.data?.narration });
        return NextResponse.json({ 
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
            errorType: err?.constructor?.name
        });
        
        console.error('Card funding error:', err);
        
        return NextResponse.json({ 
            message: errorMessage || 'An internal server error occurred.',
            details: process.env.NODE_ENV === 'development' ? errorStack : undefined
        }, { status: 500 });
    }
}
