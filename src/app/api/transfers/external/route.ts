import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { nigerianBanks } from '@/lib/banks';
import { logger } from '@/lib/logger';
import { db, userService, transactionService, notificationService } from '@/lib/db';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { executeVFDTransaction } from '@/lib/balance-sync';

export async function POST(request: NextRequest) {
    let userId: string | null = null;
    let clientReference: string | null = null;
    try {
        // 1. Authentication
        userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse and validate input
        const body = await request.json();
        const { recipientName, bankCode, accountNumber, amount, narration, clientReference: clientRefFromBody, message, photo } = body;
        clientReference = clientRefFromBody;

        if (!recipientName || !bankCode || !accountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ ok: false, message: 'Invalid request. Recipient details and amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ ok: false, message: 'Reference ID is required.' }, { status: 400 });
        }

        const bank = nigerianBanks.find(b => b.code === bankCode);
        if (!bank) {
            return NextResponse.json({ ok: false, message: 'Invalid bank code.' }, { status: 400 });
        }
        
        const transferAmountInKobo = Math.round(amount * 100);

        // 3. Check for duplicate transaction (idempotency)
        const existingTxn = await transactionService.getByReference(clientReference);
        if (existingTxn) {
            logger.info('Duplicate external transfer request', { reference: clientReference });
            const sender = await userService.getById(userId);
            return NextResponse.json({ 
                ok: true, 
                message: 'Transfer already processed.',
                data: { newBalanceInKobo: sender?.balance ?? 0 }
            });
        }

        // 4. Get sender details from Supabase
        let sender: any | null;
        try {
            sender = await userService.getById(userId);
        } catch (dbError: any) {
            logger.error('Database error getting user', { userId, error: dbError.message });
            throw new Error('Database connection failed. Please try again.');
        }

        if (!sender) {
            return NextResponse.json({ ok: false, message: 'Sender account not found.' }, { status: 404 });
        }

        // 5. Check sufficient balance
        if (sender.balance < transferAmountInKobo) {
            return NextResponse.json({ ok: false, message: 'Insufficient funds.' }, { status: 400 });
        }

        // 6. Execute transfer via VFD and update balance
        const newSenderBalance = await executeVFDTransaction(
            userId,
            sender.accountNumber || sender.account_number || '',
            async () => {
                await vfdWalletService.withdrawToBank({
                    walletId: sender.accountNumber || sender.account_number || '',
                    accountNumber,
                    bankCode,
                    amount: (transferAmountInKobo / 100).toString(),
                    reference: clientReference,
                    narration: narration || `Transfer to ${recipientName}`,
                });
            },
            transferAmountInKobo,
            'debit'
        );

        // 7. Log transaction
        await transactionService.create({
            user_id: userId,
            type: 'debit',
            category: 'transfer',
            amount: transferAmountInKobo,
            reference: clientReference,
            narration: narration || `Transfer to ${recipientName}`,
            party: {
                name: recipientName,
                account: accountNumber,
                bank: bank.name,
            },
            balance_after: newSenderBalance,
            status: 'completed',
            metadata: {
                memoMessage: message || null,
                memoImageUri: photo || null,
            },
        });

        // 8. Create notification (non-blocking)
        await notificationService.create({
            user_id: userId,
            title: 'External Transfer',
            body: `You sent ₦${(transferAmountInKobo/100).toLocaleString()} to ${recipientName} (${bank.name}).`,
            category: 'transfer',
            reference: clientReference,
            metadata: { recipientName, accountNumber, bankName: bank.name },
        });

        logger.info('External transfer completed', { userId, reference: clientReference, amount: transferAmountInKobo });

        return NextResponse.json({
            ok: true,
            message: 'Transfer successful!',
            data: { newBalanceInKobo: newSenderBalance }
        });

    } catch (error) {
        logger.error('External transfer error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
