
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

const REWARD_AMOUNT_KOBO = 500_00; // ₦500

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User document does not exist.");
            }

            const userData = userDoc.data();
            newBalance = userData.balance + REWARD_AMOUNT_KOBO;
            transaction.update(userRef, { balance: newBalance });

            const financialTransactionsRef = collection(db, 'financialTransactions');
            const creditLog = {
                userId: userId,
                category: 'referral',
                type: 'credit',
                amount: REWARD_AMOUNT_KOBO,
                reference: `REF-REWARD-${Date.now()}`,
                narration: 'Referral reward claimed',
                party: { name: 'Ovomonie Rewards' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), creditLog);
        });

        return NextResponse.json({
            message: 'Reward claimed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Reward Claim Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
