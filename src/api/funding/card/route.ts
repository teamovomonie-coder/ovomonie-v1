
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
    query,
    where,
} from 'firebase/firestore';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

export async function POST(request: Request) {
    try {
        const { amount, clientReference } = await request.json();

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }
        
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for card funding: ${clientReference} already processed.`);
                // If it exists, we assume the previous operation's return was successful.
                // Re-fetch the current balance to return the latest state.
                const userAccount = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
                const userDoc = await transaction.get(doc(db, "users", userAccount!.id!));
                newBalance = userDoc.data()!.balance;
                return;
            }

            // In a real app, you would process the payment via a payment gateway (e.g., Paystack, Stripe) here.
            // For this simulation, we'll assume the payment was successful.

            const userAccount = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
            if (!userAccount || !userAccount.id) {
                throw new Error("User account not found or is missing an ID.");
            }
            
            const amountInKobo = Math.round(amount * 100);

            const userRef = doc(db, "users", userAccount.id!);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User document does not exist.");
            }

            const userData = userDoc.data();
            newBalance = userData.balance + amountInKobo;

            transaction.update(userRef, { balance: newBalance });

            // Log the credit transaction
            const creditLog = {
                userId: userAccount.id,
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
        console.error("Card Funding Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
