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
            return NextResponse.json({ message: 'Card details (number, pin, cvv, expiry) are required for card funding.' }, { status: 400 });
        }

        const [mm, yy] = expiry.split('/');
        const expiryYyMm = `${yy}${mm}`;

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
                status: 'completed',
            });

            return NextResponse.json({ message: 'Funding successful!', newBalanceInKobo: newBalance, vfd: initiation.data }, { status: 200 });
        }

        return NextResponse.json({ message: 'VFD initiation requires further action', vfd: initiation.data || initiation }, { status: initiation.status || 200 });
    } catch (err) {
        logger.error('funding/card error', err);
        return NextResponse.json({ message: err instanceof Error ? err.message : 'An internal server error occurred.' }, { status: 500 });
    }
}
