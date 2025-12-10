
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getDb, admin } from '@/lib/firebaseAdmin';
import { nigerianBanks } from '@/lib/banks';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';

function safe(obj: any, prop: string) {
    try {
        return obj && obj[prop];
    } catch { return undefined; }
}


export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        // Ensure Firestore Admin is initialized and available
        let db: FirebaseFirestore.Firestore;
        try {
            // getDb returns a promise that resolves to Firestore instance
            db = await getDb() as any;
        } catch (initErr) {
            const msg = initErr instanceof Error ? initErr.message : String(initErr);
            logger.error('Firestore initialization failed in external transfer', initErr as Error);
            return NextResponse.json({ message: msg }, { status: 500 });
        }
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that the external transfer request arrived and whether auth header was present
        try {
            const authHeader = safe(reqHeaders, 'get')?.('authorization') || safe(reqHeaders, 'get')?.('Authorization') || null;
            logger.debug('external transfer request received', { authPresent: Boolean(authHeader), path: '/api/transfers/external' });
            // Environment diagnostics useful for TLS / connection issues
            logger.debug('firestore diagnostics', {
                googleCreds: process.env.GOOGLE_APPLICATION_CREDENTIALS ? true : false,
                firestoreEmulator: process.env.FIRESTORE_EMULATOR_HOST || null,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || null,
            });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in external transfer', { error: String(e) });
        }
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
        
        // Check idempotency outside the transaction using Admin SDK queries
        try {
            const existingTxnSnapshot = await db.collection('financialTransactions').where('reference', '==', clientReference).get();
            if (existingTxnSnapshot && !existingTxnSnapshot.empty) {
                logger.info(`Idempotent request for external transfer: ${clientReference} already processed.`);
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    newSenderBalance = (data && data.balance) || 0;
                }
                return NextResponse.json({ message: 'Transfer already processed.' , data: { newBalanceInKobo: newSenderBalance }}, { status: 200 });
            }
        } catch (e) {
            logger.warn('Idempotency check failed, proceeding with transaction', { error: String(e) });
        }

        await db.runTransaction(async (transaction) => {
            const senderRef = db.collection('users').doc(userId);
            const senderDoc = await transaction.get(senderRef);

            if (!senderDoc.exists) {
                throw new Error("Sender account not found.");
            }

            const senderData = senderDoc.data() as any;
            if ((senderData.balance || 0) < transferAmountInKobo) {
                throw new Error("Insufficient funds.");
            }
            newSenderBalance = (senderData.balance || 0) - transferAmountInKobo;
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
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                balanceAfter: newSenderBalance,
                memoMessage: message || null,
                memoImageUri: photo || null,
            };
            const newTxnRef = db.collection('financialTransactions').doc();
            transaction.set(newTxnRef, debitLog);
        });
        
                if (newSenderBalance === 0 && clientReference) {
                    const userDoc = await db.collection('users').doc(userId).get();
                    if(userDoc.exists) {
                            const data = userDoc.data();
                            newSenderBalance = (data && data.balance) || 0;
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
