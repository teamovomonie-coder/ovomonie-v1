import { NextResponse } from 'next/server';
import { mockGetAccountByNumber, mockUpdateBalance, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

export async function POST(request: Request) {
    try {
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

        // 2. Fetch accounts
        const senderAccount = await mockGetAccountByNumber(senderAccountNumber);
        const recipientAccount = await mockGetAccountByNumber(recipientAccountNumber);

        if (!senderAccount) {
            // This case should ideally not happen for a logged-in user
            return NextResponse.json({ message: 'Sender account not found.' }, { status: 404 });
        }
        if (!recipientAccount) {
            return NextResponse.json({ message: 'Recipient account not found.' }, { status: 404 });
        }

        const transferAmountInKobo = Math.round(amount * 100);

        // 3. Check for sufficient funds
        if (senderAccount.balance < transferAmountInKobo) {
            return NextResponse.json({ message: 'Insufficient funds.' }, { status: 400 });
        }

        // 4. Perform the "transaction"
        const newSenderBalance = senderAccount.balance - transferAmountInKobo;
        const newRecipientBalance = recipientAccount.balance + transferAmountInKobo;

        // In a real DB, this would be an atomic transaction
        const senderUpdateSuccess = await mockUpdateBalance(senderAccountNumber, newSenderBalance);
        const recipientUpdateSuccess = await mockUpdateBalance(recipientAccountNumber, newRecipientBalance);

        if (!senderUpdateSuccess || !recipientUpdateSuccess) {
            // Attempt to roll back - in a real DB, the transaction would handle this.
            // For this mock, we'll just assume failure and log it.
            console.error("Critical error: Failed to update balances. Could not complete transaction.");
            // Revert sender's balance if possible
            await mockUpdateBalance(senderAccountNumber, senderAccount.balance);
            return NextResponse.json({ message: 'Transaction failed due to an internal error. Please try again later.' }, { status: 500 });
        }

        // 5. Return success response
        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                sender: senderAccount.fullName,
                recipient: recipientAccount.fullName,
                amount: amount,
                newBalanceInKobo: newSenderBalance,
                reference: `OVO-INT-${Date.now()}`
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Internal Transfer Error:', error);
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
