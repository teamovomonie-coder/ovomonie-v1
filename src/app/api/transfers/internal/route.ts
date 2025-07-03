import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mockGetAccountByNumber, performTransfer, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

export async function POST(request: Request) {
    try {
        // --- API Security Check ---
        const headersList = headers();
        const authorization = headersList.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid.' }, { status: 401 });
        }
        
        const token = authorization.split(' ')[1];
        // In a real app, you'd verify this token (e.g., JWT verify, database lookup)
        // For this mock, we'll just check if it looks like our fake token.
        if (!token.startsWith('fake-token-')) {
             return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
        }
        // --- End Security Check ---

        const body = await request.json();
        const { recipientAccountNumber, amount, narration } = body;

        // 1. Validate input
        if (!recipientAccountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid request body. Recipient and amount are required.' }, { status: 400 });
        }

        const senderAccountNumber = MOCK_SENDER_ACCOUNT;
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
        const transferResult = await performTransfer(senderAccountNumber, recipientAccountNumber, transferAmountInKobo, narration);

        if (!transferResult.success) {
            return NextResponse.json({ message: transferResult.message }, { status: 400 });
        }

        // 4. Return success response
        const senderAccount = await mockGetAccountByNumber(senderAccountNumber); // Re-fetch to get latest details

        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                sender: senderAccount?.fullName,
                recipient: recipientAccount.fullName,
                amount: amount,
                newBalanceInKobo: transferResult.newSenderBalance,
                reference: transferResult.reference
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Internal Transfer Error:', error);
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
