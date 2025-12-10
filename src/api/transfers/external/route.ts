
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
import { nigerianBanks } from '@/lib/banks';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { recipientName, bankCode, accountNumber, amount, narration, clientReference, message, photo } = body;

        // 1. Validate input
        if (!recipientName || !bankCode || !accountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid request body. Recipient details and amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        const bank = nigerianBanks.find(b => b.code === bankCode);
        if (!bank) {
            return NextResponse.json({ message: 'Invalid recipient bank.' }, { status: 400 });
        }
        
        const transferAmountInKobo = Math.round(amount * 100);
        let newSenderBalance = 0;
        
        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                logger.info(`Idempotent request for external transfer: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) {
                    newSenderBalance = userDoc.data().balance;
                }
                return;
            }

            const senderRef = doc(db, "users", userId);
            const senderDoc = await transaction.get(senderRef);
            
            if (!senderDoc.exists()) {
                throw new Error("Sender account not found.");
            }
            
            const senderData = senderDoc.data();
            if (senderData.balance < transferAmountInKobo) {
                throw new Error("Insufficient funds.");
            }

            newSenderBalance = senderData.balance - transferAmountInKobo;
            transaction.update(senderRef, { balance: newSenderBalance });

            // Log the debit transaction
            const debitLog = {
                userId: userId,
                category: 'transfer',
                type: 'debit',
                amount: transferAmountInKobo,
                reference: clientReference,
                narration: narration || `Transfer to ${recipientName}`,
                party: {
                    name: recipientName,
                    account: accountNumber,
                    bank: bank.name,
                },
                timestamp: serverTimestamp(),
                balanceAfter: newSenderBalance,
                memoMessage: message || null,
                memoImageUri: photo || null,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });
        
        if (newSenderBalance === 0 && clientReference) {
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);
          if(userDoc.exists()) {
              newSenderBalance = userDoc.data().balance;
          }
        }
        
        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                newBalanceInKobo: newSenderBalance,
            }
        }, { status: 200 });

    } catch (error) {
        logger.error('External Transfer Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
