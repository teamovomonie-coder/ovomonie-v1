
import { NextResponse } from 'next/server';
import { getDb, admin } from '@/lib/firebaseAdmin';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { amount, category, party, narration, clientReference } = await request.json();

        if (!amount || typeof amount !== 'number' || amount <= 0 || !category || !party) {
            return NextResponse.json({ message: 'A valid amount, category, and party details are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        const db = await getDb();
        let newBalance = 0;

        // Idempotency pre-check
        try {
            const existing = await db.collection('financialTransactions').where('reference', '==', clientReference).get();
            if (existing && !existing.empty) {
                logger.info(`Idempotent request for payment: ${clientReference} already processed.`);
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) newBalance = (userDoc.data() as any).balance || 0;
                return NextResponse.json({ message: 'Payment already processed.', data: { newBalanceInKobo: newBalance } }, { status: 200 });
            }
        } catch (e) {
            logger.warn('Idempotency check failed, proceeding with transaction', { error: String(e) });
        }

        await db.runTransaction(async (transaction) => {
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error('User document does not exist.');
            }

            const userData = userDoc.data() as any;
            const amountInKobo = Math.round(amount * 100);
            if ((userData.balance || 0) < amountInKobo) {
                throw new Error('Insufficient funds for this payment.');
            }

            newBalance = (userData.balance || 0) - amountInKobo;
            transaction.update(userRef, { balance: newBalance });

            const debitLog = {
                userId: userId,
                category: category,
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Payment for ${party.name}`,
                party: party,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                balanceAfter: newBalance,
            };

            transaction.set(db.collection('financialTransactions').doc(), debitLog);
        });

        if (newBalance === 0 && clientReference) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) newBalance = (userDoc.data() as any).balance || 0;
        }

        return NextResponse.json({
            message: 'Payment successful!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        logger.error("Generic Payment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
