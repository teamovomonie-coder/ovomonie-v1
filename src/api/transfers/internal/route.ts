
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mockGetAccountByNumber, performTransfer } from '@/lib/user-data';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

        const userId = token.split('-')[2];
        if (!userId) {
            return NextResponse.json({ message: 'User ID not found in token.' }, { status: 401 });
        }
        // --- End Security Check ---

        const body = await request.json();
        const { recipientAccountNumber, amount, narration, clientReference } = body;

        // 1. Validate input
        if (!recipientAccountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid request body. Recipient and amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
             return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        // Fetch sender's account details using the authenticated user ID
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

        // 2. Fetch recipient account to ensure it exists before attempting transfer
        const recipientAccount = await mockGetAccountByNumber(recipientAccountNumber);
        if (!recipientAccount) {
            return NextResponse.json({ message: 'Recipient account not found.' }, { status: 404 });
        }
        
        // 3. Perform the "transaction"
        const transferAmountInKobo = Math.round(amount * 100);
        const transferResult = await performTransfer(
            senderAccountNumber, 
            recipientAccountNumber, 
            transferAmountInKobo, 
            clientReference,
            narration
        );

        if (!transferResult.success) {
            return NextResponse.json({ message: transferResult.message }, { status: 400 });
        }

        // 4. Return success response
        const finalSenderAccount = await mockGetAccountByNumber(senderAccountNumber); // Re-fetch to get latest details

        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                sender: finalSenderAccount?.fullName,
                recipient: recipientAccount.fullName,
                amount: amount,
                newBalanceInKobo: transferResult.newSenderBalance,
                reference: transferResult.reference
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Internal Transfer Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
