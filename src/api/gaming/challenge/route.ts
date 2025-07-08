
'use server';

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
    getDoc,
} from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid.' }, { status: 401 });
        }
        
        const token = authorization.split(' ')[1];
        if (!token.startsWith('fake-token-')) {
             return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
        }

        const userId = token.split('-')[2];
        if (!userId) {
            return NextResponse.json({ message: 'User ID not found in token.' }, { status: 401 });
        }

        const { gameId, entryFee, clientReference } = await request.json();

        if (!gameId || typeof entryFee !== 'number' || entryFee <= 0) {
            return NextResponse.json({ message: 'A valid game ID and entry fee are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
        }
        
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for game entry: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) {
                    newBalance = userDoc.data().balance;
                }
                return;
            }

            const amountInKobo = Math.round(entryFee * 100);
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) throw new Error("User document does not exist.");

            const userData = userDoc.data();
            if (userData.balance < amountInKobo) {
                throw new Error("Insufficient funds for game entry fee.");
            }

            newBalance = userData.balance - amountInKobo;
            transaction.update(userRef, { balance: newBalance });

            const debitLog = {
                userId: userId,
                category: 'gaming',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: `Entry fee for ${gameId}`,
                party: { name: 'Ovomonie Games' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        return NextResponse.json({
            message: 'Game challenge started successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Game Challenge Start Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}


export async function PUT(request: Request) {
    try {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid.' }, { status: 401 });
        }
        
        const token = authorization.split(' ')[1];
        if (!token.startsWith('fake-token-')) {
             return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
        }

        const userId = token.split('-')[2];
        if (!userId) {
            return NextResponse.json({ message: 'User ID not found in token.' }, { status: 401 });
        }

        const { gameId, prize, clientReference } = await request.json();

        if (!gameId || typeof prize !== 'number' || prize <= 0) {
            return NextResponse.json({ message: 'A valid game ID and prize amount are required.' }, { status: 400 });
        }
         if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
        }
        
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for game prize: ${clientReference} already processed.`);
                 const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if(userDoc.exists()) newBalance = userDoc.data().balance;
                return;
            }

            const amountInKobo = Math.round(prize * 100);
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) throw new Error("User document does not exist.");
            
            newBalance = userDoc.data().balance + amountInKobo;
            transaction.update(userRef, { balance: newBalance });

            const creditLog = {
                userId: userId,
                category: 'gaming',
                type: 'credit',
                amount: amountInKobo,
                reference: clientReference,
                narration: `Prize for winning ${gameId}`,
                party: { name: 'Ovomonie Games' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), creditLog);
        });

        return NextResponse.json({
            message: 'Prize claimed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Game Prize Claim Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
