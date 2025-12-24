import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { nigerianBanks } from '@/lib/banks';
import { logger } from '@/lib/logger';
import { userService, transactionService, notificationService } from '@/lib/db';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { getVFDAccessToken } from '@/lib/vfd-auth';

/**
 * Check VFD API connectivity before processing transfers
 */
async function checkVFDConnectivity(): Promise<void> {
  try {
    await getVFDAccessToken();
    logger.info('VFD API connectivity verified');
  } catch (error) {
    logger.error('VFD API connectivity failed', { error });
    throw new Error('Banking service is currently unavailable. Please try again later.');
  }
}

export async function POST(request: NextRequest) {
    let userId: string = null;
    let clientReference: string = null;
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
<<<<<<< HEAD
        let sender: DbUser | null;
=======
        let sender: any | null;
>>>>>>> f903fae907e75606307fe15fc6b05a04460c0c7d
        try {
            sender = await userService.getById(userId);
        } catch (dbError: any) {
            logger.error('Database error getting user', { userId, error: dbError.message });
            throw new Error('Database connection failed. Please try again.');
        }
<<<<<<< HEAD
        
=======

>>>>>>> f903fae907e75606307fe15fc6b05a04460c0c7d
        if (!sender) {
            return NextResponse.json({ ok: false, message: 'Sender account not found.' }, { status: 404 });
        }

        // 5. Check sufficient balance
        if (sender.balance < transferAmountInKobo) {
            return NextResponse.json({ ok: false, message: 'Insufficient funds.' }, { status: 400 });
        }

        // 6. Check VFD API connectivity
        await checkVFDConnectivity();

<<<<<<< HEAD
        // 7. Execute transfer via VFD API
        logger.info('External transfer via VFD API', { userId, reference: clientReference, amount: transferAmountInKobo });
        
        try {
            await vfdWalletService.withdrawToBank({
                walletId: sender.accountNumber || sender.account_number || '',
                accountNumber,
                bankCode,
                amount: (transferAmountInKobo / 100).toString(),
                reference: clientReference,
                narration: narration || `Transfer to ${recipientName}`,
            });
            
            logger.info('VFD transfer completed successfully', { reference: clientReference });
        } catch (vfdError: any) {
            logger.error('VFD transfer failed', { error: vfdError.message, reference: clientReference });
            
            // Development fallback - simulate successful transfer
            if (process.env.NODE_ENV === 'development') {
                logger.warn('Using development fallback for external transfer', { reference: clientReference });
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw new Error(`Transfer failed: ${vfdError.message}`);
            }
        }

        // 8. Deduct balance only after successful VFD transfer
        const newSenderBalance = sender.balance - transferAmountInKobo;
        try {
            await userService.updateBalance(userId, newSenderBalance);
        } catch (dbError: any) {
            logger.error('Database error updating balance', { userId, error: dbError.message });
            throw new Error('Failed to update account balance. Please contact support.');
        }

        // 9. Log transaction
        try {
            await transactionService.create({
                user_id: userId,
                type: 'debit',
                category: 'transfer',
                amount: transferAmountInKobo,
                reference: clientReference,
                narration: narration || `Transfer to ${recipientName} (${bank.name})`,
                party: {
                    name: recipientName,
                    account: accountNumber,
                    bank: bank.name,
                },
                balance_after: newSenderBalance,
                metadata: {
                    memoMessage: message || null,
                    memoImageUri: photo || null,
                },
            });
        } catch (dbError: any) {
            logger.error('Database error creating transaction', { reference: clientReference, error: dbError.message });
            // Don't throw here - transaction already completed, just log the error
        }

        // 10. Create notification (non-blocking)
        try {
            await notificationService.create({
                user_id: userId,
                title: 'External Transfer',
                body: `You sent ₦${(transferAmountInKobo/100).toLocaleString()} to ${recipientName} (${bank.name}).`,
                category: 'transfer',
                reference: clientReference,
                metadata: { recipientName, accountNumber, bankName: bank.name },
            });
        } catch (dbError: any) {
            logger.error('Database error creating notification', { reference: clientReference, error: dbError.message });
            // Don't throw here - notification is non-critical
        }
=======
        // 7. Log transaction
        await transactionService.create({
            user_id: userId,
            type: 'debit',
            amount: transferAmountInKobo,
            reference: clientReference,
            narration: narration || `Transfer to ${recipientName}`,
            party_name: "Transaction",
            balance_after: newSenderBalance,
            status: "completed",
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
            reference: clientReference,
            metadata: { recipientName, accountNumber, bankName: bank.name },
        });
>>>>>>> f903fae907e75606307fe15fc6b05a04460c0c7d

        logger.info('External transfer completed', { userId, reference: clientReference, amount: transferAmountInKobo });

        return NextResponse.json({
            ok: true,
            message: 'Transfer successful!',
            data: { 
                newBalanceInKobo: newSenderBalance,
                transactionId: clientReference
            }
        });

    } catch (error) {
        logger.error('External transfer error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            reference: clientReference
        });
        
        let errorMessage = 'An unexpected error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        return NextResponse.json({ ok: false, message: errorMessage }, { status: 500 });
    }
}
