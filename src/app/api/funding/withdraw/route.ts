import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processVFDWithdrawal, queryVFDTransaction } from '@/lib/vfd-transactions';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { validateBothPins } from '@/lib/pin-validator';
import { logger } from '@/lib/logger';
import { createNotification, NotificationTemplates } from '@/lib/notification-helper';

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
        const { amount, reference, userPin, transactionPin, bankAccountNumber } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount.' }, { status: 400 });
        }
        if (!reference) {
            return NextResponse.json({ message: 'Reference ID is required.' }, { status: 400 });
        }
        if (!userPin || !transactionPin) {
            return NextResponse.json({ message: 'Pins are required.' }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
        }

        // Get user details
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('phone, full_name, balance, login_pin_hash, transaction_pin_hash')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            logger.error('User not found:', userError);
            return NextResponse.json({ message: 'User account not found.' }, { status: 400 });
        }

        // Validate both PINs
        const pinValidation = validateBothPins(
            userPin,
            transactionPin,
            userData.login_pin_hash || '',
            userData.transaction_pin_hash || ''
        );

        if (!pinValidation.isValid) {
            logger.warn('Invalid PIN attempt for withdrawal', { userId, errors: pinValidation.errors });
            const errorMsg = pinValidation.errors.join('; ');
            return NextResponse.json({ message: `${errorMsg}. Please try again.` }, { status: 401 });
        }

        // Check sufficient balance
        if (userData.balance < amount * 100) {
            return NextResponse.json({ message: 'Insufficient balance for this withdrawal.' }, { status: 400 });
        }

        // PRIMARY: Process withdrawal via VFD
        logger.info('[WITHDRAWAL] Processing via VFD...', { reference });
        const vfdResult = await processVFDWithdrawal(
            userData.phone,
            userPin,
            transactionPin,
            amount,
            reference,
            bankAccountNumber
        );

        if (!vfdResult.success) {
            // Try to query if it's a timing issue
            await new Promise(r => setTimeout(r, 2000));
            const queryResult = await queryVFDTransaction(reference);
            if (!queryResult.success) {
                logger.error('[WITHDRAWAL] VFD withdrawal failed:', vfdResult);
                return NextResponse.json({ message: vfdResult.message || 'Withdrawal failed at payment gateway' }, { status: 400 });
            }
        }

        // SECONDARY: Update balance in Supabase
        try {
            const amountKobo = Math.round(amount * 100);
            const newBalance = userData.balance - amountKobo;

            // Update user balance
            await supabase
                .from('users')
                .update({ balance: newBalance })
                .eq('id', userId);

            // Log transaction
            await supabase
                .from('financial_transactions')
                .insert({
                    user_id: userId,
                    category: 'withdrawal',
                    type: 'debit',
                    amount: amountKobo,
                    reference: reference,
                    narration: `Withdrawal to bank account`,
                    party: { bankAccount: bankAccountNumber },
                    balance_after: newBalance,
                });

            // Create notification using helper with template
            const notifSuccess = await createNotification({
                userId,
                ...NotificationTemplates.withdrawalProcessed(amountKobo),
                reference,
            });

            if (!notifSuccess) {
                logger.error('[WITHDRAWAL] Failed to create notification');
            } else {
                logger.info('[WITHDRAWAL] Notification created successfully');
            }

            logger.info('[WITHDRAWAL] Backed up to Supabase', { reference });
        } catch (backupError) {
            logger.warn('[WITHDRAWAL] Supabase backup failed (non-blocking):', backupError);
        }

        return NextResponse.json({
            message: 'Withdrawal successful!',
            data: {
                amount: amount,
                reference: reference,
                newBalance: userData.balance - amount,
                timestamp: new Date().toISOString(),
            }
        }, { status: 200 });

    } catch (error) {
        logger.error('Withdrawal Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
