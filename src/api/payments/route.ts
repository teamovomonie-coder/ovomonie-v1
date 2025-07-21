
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
    query,
    where,
    getDoc,
} from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(headers());
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

        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for payment: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) {
                    newBalance = userDoc.data().balance;
                }
                return;
            }
            
            const amountInKobo = Math.round(amount * 100);
            
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User document does not exist.");
            }

            const userData = userDoc.data();
            if (userData.balance < amountInKobo) {
                throw new Error("Insufficient funds for this payment.");
            }
            
            newBalance = userData.balance - amountInKobo;

            transaction.update(userRef, { balance: newBalance });

            // Log the debit transaction
            const debitLog = {
                userId: userId,
                category: category,
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: narration || `Payment for ${party.name}`,
                party: party,
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        if (newBalance === 0 && clientReference) {
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            if(userDoc.exists()){
                newBalance = userDoc.data().balance
            }
        }

        return NextResponse.json({
            message: 'Payment successful!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Generic Payment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
