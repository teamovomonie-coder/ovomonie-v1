import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { validateTransactionPin } from '@/lib/pin-validator';
import { logger } from '@/lib/logger';
import { db, userService, transactionService, notificationService } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse and validate input
        const body = await request.json();
        const { recipientAccountNumber, amount, narration, clientReference, senderPin } = body;

        if (!recipientAccountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ ok: false, message: 'Invalid request. Recipient and amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ ok: false, message: 'Reference ID is required.' }, { status: 400 });
        }
        if (!senderPin) {
            return NextResponse.json({ ok: false, message: 'Transaction PIN is required.' }, { status: 400 });
        }

        // 3. Get sender details
        const sender = await userService.getById(userId);
        if (!sender) {
            return NextResponse.json({ ok: false, message: 'Sender account not found.' }, { status: 404 });
        }

        // 4. Validate transaction PIN
        const isValidPin = validateTransactionPin(senderPin, sender.transaction_pin_hash || '');
        if (!isValidPin) {
            logger.warn('Invalid transaction PIN attempt', { userId });
            return NextResponse.json({ ok: false, message: 'Invalid transaction PIN.' }, { status: 401 });
        }

        // 5. Check self-transfer
        if (recipientAccountNumber === sender.account_number) {
            return NextResponse.json({ ok: false, message: 'Cannot transfer to yourself.' }, { status: 400 });
        }

        // 6. Get recipient details
        const recipient = await userService.getByAccountNumber(recipientAccountNumber);
        if (!recipient) {
            return NextResponse.json({ ok: false, message: 'Recipient account not found.' }, { status: 404 });
        }

        const amountKobo = Math.round(amount * 100);

        // 7. Check sufficient balance
        if (sender.balance < amountKobo) {
            return NextResponse.json({ ok: false, message: 'Insufficient balance.' }, { status: 400 });
        }

        // 8. Update balances
        const newSenderBalance = sender.balance - amountKobo;
        const newRecipientBalance = recipient.balance + amountKobo;

        await userService.updateBalance(userId, newSenderBalance);
        await userService.updateBalance(recipient.id, newRecipientBalance);

        // 9. Log transactions
        await transactionService.create({
            user_id: userId,
            type: 'debit',
            category: 'transfer',
            amount: amountKobo,
            reference: `${clientReference}-debit`,
            narration: `Transfer to Ovomonie user ${recipient.full_name}`,
            party: { to: recipient.phone, name: recipient.full_name },
            balance_after: newSenderBalance,
        });

        await transactionService.create({
            user_id: recipient.id,
            type: 'credit',
            category: 'transfer',
            amount: amountKobo,
            reference: `${clientReference}-credit`,
            narration: `Transfer from Ovomonie user ${sender.full_name}`,
            party: { from: sender.phone, name: sender.full_name },
            balance_after: newRecipientBalance,
        });

        // 10. Create notifications (non-blocking)
        try {
            await notificationService.create({
                user_id: userId,
                title: 'Transfer Sent',
                body: `You sent ₦${(amountKobo/100).toLocaleString()} to ${recipient.full_name}.`,
                category: 'transfer',
                reference: clientReference,
            });

            await notificationService.create({
                user_id: recipient.id,
                title: 'Transfer Received',
                body: `You received ₦${(amountKobo/100).toLocaleString()} from ${sender.full_name}.`,
                category: 'transfer',
                reference: clientReference,
            });
        } catch (notifError) {
            logger.warn('Failed to create notifications', { error: notifError });
        }

        logger.info('Internal transfer completed', { userId, reference: clientReference, amount: amountKobo });

        return NextResponse.json({
            ok: true,
            message: 'Transfer successful!',
            data: {
                recipient: recipientAccountNumber,
                recipientName: recipient.full_name,
                amount,
                reference: clientReference,
                timestamp: new Date().toISOString(),
                newBalanceInKobo: newSenderBalance,
                transactionId: clientReference,
            }
        });

    } catch (error: any) {
        logger.error('Internal transfer error:', { error: error?.message, stack: error?.stack });
        const message = error?.message || 'An unexpected error occurred.';
        return NextResponse.json({ 
            ok: false, 
            message,
            error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined 
        }, { status: 500 });
    }
}
