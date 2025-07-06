
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

export async function POST(request: Request) {
    try {
        const { amount, category, party, narration } = await request.json();

        if (!amount || typeof amount !== 'number' || amount <= 0 || !category || !party) {
            return NextResponse.json({ message: 'A valid amount, category, and party details are required.' }, { status: 400 });
        }

        const userAccount = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
        if (!userAccount || !userAccount.id) {
            throw new Error("User account not found or is missing an ID.");
        }
        
        const amountInKobo = Math.round(amount * 100);
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userAccount.id!);
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
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const debitLog = {
                userId: userAccount.id,
                category: category,
                type: 'debit',
                amount: amountInKobo,
                reference: `OVO-PAY-${Date.now()}`,
                narration: narration || `Payment for ${party.name}`,
                party: party,
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

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
