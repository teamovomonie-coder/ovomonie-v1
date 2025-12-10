
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { performTransfer } from '@/lib/user-data';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that the internal transfer request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('internal transfer request received', { authPresent: Boolean(authHeader), path: '/api/transfers/internal' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in internal transfer');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { recipientAccountNumber, amount, narration, clientReference, message, photo } = body;

        if (!recipientAccountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid request body. Recipient and amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
             return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        const senderRef = doc(db, "users", userId);
        const senderDoc = await getDoc(senderRef);
        if (!senderDoc.exists()) {
            throw new Error("Sender account not found.");
        }
        const senderAccountDetails = senderDoc.data();
        const senderAccountNumber = senderAccountDetails.accountNumber;

        if (recipientAccountNumber === senderAccountNumber) {
            return NextResponse.json({ message: 'You cannot transfer money to yourself.' }, { status: 400 });
        }
        
        const transferAmountInKobo = Math.round(amount * 100);
        const transferResult = await performTransfer(
            userId,
            recipientAccountNumber, 
            transferAmountInKobo, 
            clientReference,
            narration,
            message,
            photo
        );

        if (!transferResult.success) {
            return NextResponse.json({ message: transferResult.message }, { status: 400 });
        }
        
        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                recipient: transferResult.recipientName,
                amount: amount,
                newBalanceInKobo: transferResult.newSenderBalance,
                reference: transferResult.reference
            }
        }, { status: 200 });

    } catch (error) {
        logger.error('Internal Transfer Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
