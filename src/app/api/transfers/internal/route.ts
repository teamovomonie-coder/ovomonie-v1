import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getUserById, getUserByAccountNumber, updateUserBalance, createTransaction, createNotification } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { recipientAccountNumber, amount, narration, clientReference, senderPin } = body;

        if (!recipientAccountNumber || !amount || amount <= 0) {
            return NextResponse.json({ ok: false, message: 'Invalid request data' }, { status: 400 });
        }

        // Get sender
        const sender = await getUserById(userId);
        if (!sender) {
            return NextResponse.json({ ok: false, message: 'Sender not found' }, { status: 404 });
        }

        // Get recipient
        const recipient = await getUserByAccountNumber(recipientAccountNumber);
        if (!recipient) {
            return NextResponse.json({ ok: false, message: 'Recipient not found' }, { status: 404 });
        }

        // Check self-transfer
        if (recipientAccountNumber === sender.account_number) {
            return NextResponse.json({ ok: false, message: 'Cannot transfer to yourself' }, { status: 400 });
        }

        // Convert to kobo
        const amountKobo = Math.round(amount * 100);

        // Check balance
        if (sender.balance < amountKobo) {
            return NextResponse.json({ ok: false, message: 'Insufficient balance' }, { status: 400 });
        }

        // Update balances
        const newSenderBalance = sender.balance - amountKobo;
        const newRecipientBalance = recipient.balance + amountKobo;

        await updateUserBalance(userId, newSenderBalance);
        await updateUserBalance(recipient.id, newRecipientBalance);

        // Create transactions
        await createTransaction({
            user_id: userId,
            category: 'transfer',
            type: 'debit',
            amount: amountKobo,
            reference: `${clientReference}-debit`,
            narration: narration || `Transfer to ${recipient.full_name}`,
            party_name: recipient.full_name,
            balance_after: newSenderBalance,
        });

        await createTransaction({
            user_id: recipient.id,
            category: 'transfer',
            type: 'credit',
            amount: amountKobo,
            reference: `${clientReference}-credit`,
            narration: narration || `Transfer from ${sender.full_name}`,
            party_name: sender.full_name,
            balance_after: newRecipientBalance,
        });

        // Create notifications
        await createNotification({
            user_id: userId,
            title: 'Money Sent',
            body: `₦${amount.toLocaleString()} sent to ${recipient.full_name}`,
            category: 'transaction',
        });

        await createNotification({
            user_id: recipient.id,
            title: 'Money Received',
            body: `₦${amount.toLocaleString()} received from ${sender.full_name}`,
            category: 'transaction',
        });

        return NextResponse.json({
            ok: true,
            message: 'Transfer successful!',
            data: {
                newBalanceInKobo: newSenderBalance,
                transactionId: clientReference,
                recipientName: recipient.full_name,
                amount: amount,
                reference: clientReference
            }
        });

    } catch (error) {
        console.error('Internal transfer error:', error);
        return NextResponse.json({ 
            ok: false, 
            message: 'Internal server error'
        }, { status: 500 });
    }
}