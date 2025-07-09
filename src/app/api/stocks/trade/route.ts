
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
    addDoc,
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

        const { stock, quantity, orderType, limitPrice, tradeType, clientReference } = await request.json();

        if (!stock || !quantity || !orderType || !tradeType) {
            return NextResponse.json({ message: 'Missing required trade fields.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
        }

        const price = orderType === 'Limit' ? limitPrice : stock.price;
        const totalCostKobo = Math.round(price * quantity * 100);
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for trade: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) newBalance = userDoc.data().balance;
                return;
            }
            
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found.");

            const userData = userDoc.data();
            if (userData.balance < totalCostKobo) {
                throw new Error("Insufficient funds for this trade.");
            }
            
            newBalance = userData.balance - totalCostKobo;
            transaction.update(userRef, { balance: newBalance });

            const holdingsQuery = query(collection(db, "stockHoldings"), where("userId", "==", userId), where("symbol", "==", stock.symbol));
            const holdingsSnapshot = await getDocs(holdingsQuery);
            
            if (holdingsSnapshot.empty) {
                // New holding
                const newHoldingRef = doc(collection(db, "stockHoldings"));
                transaction.set(newHoldingRef, {
                    userId,
                    symbol: stock.symbol,
                    quantity,
                    avgBuyPrice: price,
                });
            } else {
                // Update existing holding
                const holdingDoc = holdingsSnapshot.docs[0];
                const holdingData = holdingDoc.data();
                const newQuantity = holdingData.quantity + quantity;
                const newTotalCost = (holdingData.avgBuyPrice * holdingData.quantity) + (price * quantity);
                const newAvgBuyPrice = newTotalCost / newQuantity;
                transaction.update(holdingDoc.ref, {
                    quantity: newQuantity,
                    avgBuyPrice: newAvgBuyPrice,
                });
            }

            // Log the financial transaction
            const debitLog = {
                userId: userId,
                category: 'investment',
                type: 'debit',
                amount: totalCostKobo,
                reference: clientReference,
                narration: `Buy ${quantity} units of ${stock.symbol}`,
                party: { name: 'NGX Stocks' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        return NextResponse.json({
            message: 'Trade executed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Trade Execution Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
