
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { validateTransactionPin } from '@/lib/pin-validator';
import { logger } from '@/lib/logger';
import { createNotifications, NotificationTemplates } from '@/lib/notification-helper';

// Initialize Supabase for backup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { recipientAccountNumber, amount, narration, clientReference, senderPin } = body;

        if (!recipientAccountNumber || !amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid request body. Recipient and amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
             return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }
        if (!senderPin) {
            return NextResponse.json({ message: 'Transaction PIN is required.' }, { status: 400 });
        }

        // Get sender details from Supabase
        if (!supabase) {
            return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
        }

        const { data: senderData, error: senderError } = await supabase
            .from('users')
            .select('phone, full_name, account_number, balance, transaction_pin_hash')
            .eq('id', userId)
            .single();

        if (senderError || !senderData) {
            logger.error('Sender not found:', senderError);
            return NextResponse.json({ message: 'Sender account not found.' }, { status: 400 });
        }

        // Validate transaction PIN
        const isValidPin = validateTransactionPin(senderPin, senderData.transaction_pin_hash || '');
        if (!isValidPin) {
            logger.warn('Invalid transaction PIN attempt', { userId });
            return NextResponse.json({ message: 'Invalid transaction PIN. Please try again.' }, { status: 401 });
        }

        if (recipientAccountNumber === senderData.account_number) {
            return NextResponse.json({ message: 'You cannot transfer money to yourself.' }, { status: 400 });
        }

        // Get recipient details
        const { data: recipientData, error: recipientError } = await supabase
            .from('users')
            .select('phone, full_name, account_number, balance, id')
            .eq('account_number', recipientAccountNumber)
            .single();

        if (recipientError || !recipientData) {
            logger.error('Recipient not found:', recipientError);
            return NextResponse.json({ message: 'Recipient account not found.' }, { status: 400 });
        }

        const senderBalance = Number(senderData.balance ?? 0);
        const amountKobo = Math.round(amount * 100);

        // Check sufficient balance
        if (senderBalance < amountKobo) { // balance in kobo
            return NextResponse.json({ message: 'Insufficient balance for this transfer.' }, { status: 400 });
        }

        // DIRECT: Use Supabase ledger only for internal transfers
        const recipientBalance = Number(recipientData.balance ?? 0);
        const newSenderBalance = senderBalance - amountKobo;
        const newRecipientBalance = recipientBalance + amountKobo;

        const { error: senderUpdateError } = await supabase
            .from('users')
            .update({ balance: newSenderBalance })
            .eq('id', userId);

        if (senderUpdateError) {
            logger.error('[TRANSFER] Failed to update sender balance', senderUpdateError);
            return NextResponse.json({ message: 'Could not update sender balance.' }, { status: 500 });
        }

        const { error: recipientUpdateError } = await supabase
            .from('users')
            .update({ balance: newRecipientBalance })
            .eq('id', recipientData.id);

        if (recipientUpdateError) {
            logger.error('[TRANSFER] Failed to update recipient balance', recipientUpdateError);
            return NextResponse.json({ message: 'Could not update recipient balance.' }, { status: 500 });
        }

        const { error: transactionError } = await supabase
            .from('financial_transactions')
            .insert([
                {
                    user_id: userId,
                    category: 'transfer',
                    type: 'debit',
                    amount: amountKobo,
                    reference: `${clientReference}-debit`,
                    narration: narration || `Transfer to ${recipientData.full_name}`,
                    party: { to: recipientData.phone },
                    balance_after: newSenderBalance,
                },
                {
                    user_id: recipientData.id,
                    category: 'transfer',
                    type: 'credit',
                    amount: amountKobo,
                    reference: `${clientReference}-credit`,
                    narration: narration || `Transfer from ${senderData.full_name}`,
                    party: { from: senderData.phone },
                    balance_after: newRecipientBalance,
                },
            ]);

        if (transactionError) {
            logger.error('[TRANSFER] Failed to log transactions', transactionError);
            return NextResponse.json({ message: 'Could not record transaction history.' }, { status: 500 });
        }

        // Create notifications using helper with templates (non-blocking)
        // Transfer succeeded - notification failure should not cause 500 error
        try {
            const notificationSuccess = await createNotifications([
                {
                    userId,
                    ...NotificationTemplates.internalTransferSent(recipientData.full_name, amountKobo),
                    reference: clientReference,
                    senderName: senderData.full_name,
                    recipientName: recipientData.full_name,
                },
                {
                    userId: recipientData.id,
                    ...NotificationTemplates.internalTransferReceived(senderData.full_name, amountKobo),
                    reference: clientReference,
                    senderName: senderData.full_name,
                    recipientName: recipientData.full_name,
                },
            ]);
            
            if (!notificationSuccess) {
                logger.warn('[TRANSFER] Notifications failed but transfer succeeded');
            } else {
                logger.info('[TRANSFER] Notifications created successfully');
            }
        } catch (notifErr) {
            // Log but don't fail the transfer - the money has already moved
            logger.warn('[TRANSFER] Notification creation threw (transfer still succeeded)', notifErr);
        }

        return NextResponse.json({
            message: 'Transfer successful!',
            data: {
                recipient: recipientAccountNumber,
                recipientName: recipientData.full_name,
                amount,
                reference: clientReference,
                timestamp: new Date().toISOString(),
                newBalanceInKobo: newSenderBalance,
                transactionId: clientReference,
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
