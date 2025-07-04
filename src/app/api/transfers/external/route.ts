
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { nigerianBanks } from '@/lib/banks';

export async function POST(request: Request) {
    try {
        // --- API Security Check ---
        const headersList = headers();
        const authorization = headersList.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid.' }, { status: 401 });
        }
        
        const token = authorization.split(' ')[1];
        if (!token.startsWith('fake-token-')) {
             return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
        }
        // --- End Security Check ---

        const body = await request.json();
        const { recipientName, bankCode, accountNumber, amount, narration } = body;

        // 1. Validate input
        if (!recipientName || !bankCode || !accountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid request body. Recipient details and amount are required.' }, { status: 400 });
        }

        const senderAccountDetails = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
        if (!senderAccountDetails || !senderAccountDetails.id) {
            throw new Error("Sender account not found.");
        }

        const bank = nigerianBanks.find(b => b.code === bankCode);
        if (!bank) {
            return NextResponse.json({ message: 'Invalid recipient bank.' }, { status: 400 });
        }
        
        // 2. Perform the "transaction"
        const transferAmountInKobo = Math.round(amount * 100);
        let newSenderBalance = 0;
        
        await runTransaction(db, async (transaction) => {
            const senderRef = doc(db, "users", senderAccountDetails.id!);
            const senderDoc = await transaction.get(senderRef);
            
            if (!senderDoc.exists()) {
                throw new Error("Sender document does not exist.");
            }
            
            const senderData = senderDoc.data();
            if (senderData.balance < transferAmountInKobo) {
                throw new Error("Insufficient funds.");
            }

            newSenderBalance = senderData.balance - transferAmountInKobo;
            transaction.update(senderRef, { balance: newSenderBalance });

            // Log the debit transaction
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const debitLog = {
                userId: senderAccountDetails.id,
                category: 'transfer',
                type: 'debit',
                amount: transferAmountInKobo,
                reference: `OVO-EXT-${Date.now()}`,
                narration: narration || `Transfer to ${recipientName}`,
                party: {
                    name: recipientName,
                    account: accountNumber,
                    bank: bank.name,
                },
                timestamp: serverTimestamp(),
                balanceAfter: newSenderBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        // 3. Return success response
        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                newBalanceInKobo: newSenderBalance,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('External Transfer Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
