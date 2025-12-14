
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';



export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }


        const { amount, clientReference } = await request.json();

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }
        
        let newBalance = 0;

        // Check for duplicate request before transaction
        const financialTransactionsRef = collection(db, 'financialTransactions');
        const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
        const existingTxnSnapshot = await getDocs(idempotencyQuery);
        if (!existingTxnSnapshot.empty) {
            logger.info(`Idempotent request for card funding: ${clientReference} already processed.`);
            return NextResponse.json({ message: 'Transaction already processed.', newBalanceInKobo: 0 }, { status: 200 });
        }

        await runTransaction(db, async (transaction) => {

            // In a real app, you would process the payment via a payment gateway (e.g., Paystack, Stripe) here.
            // For this simulation, we'll assume the payment was successful.

            const amountInKobo = Math.round(amount * 100);

            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User document does not exist.");
            }

            const userData = userDoc.data();
            newBalance = userData.balance + amountInKobo;

            transaction.update(userRef, { balance: newBalance });

            // Log the credit transaction
            const creditLog = {
                userId: userId,
                category: 'deposit',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                narration: 'Card deposit to wallet',
                party: { name: 'Card Deposit' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), creditLog);
        });

        return NextResponse.json({
            message: 'Funding successful!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        logger.error("Card Funding Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
