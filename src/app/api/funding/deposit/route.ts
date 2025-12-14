import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processVFDDeposit, queryVFDTransaction } from '@/lib/vfd-transactions';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { validateLoginPin } from '@/lib/pin-validator';
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
        const { amount, reference, paymentMethod = 'card', cardDetails, userPin } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount.' }, { status: 400 });
        }
        if (!reference) {
            return NextResponse.json({ message: 'Reference ID is required.' }, { status: 400 });
        }
        if (!userPin) {
            return NextResponse.json({ message: 'PIN is required.' }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
        }

        // Get user details
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('phone, full_name, balance, login_pin_hash')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            logger.error('User not found:', userError);
            return NextResponse.json({ message: 'User account not found.' }, { status: 400 });
        }

        // Validate PIN (using login PIN for deposits)
        const isValidPin = validateLoginPin(userPin, userData.login_pin_hash || '');
        if (!isValidPin) {
            logger.warn('Invalid PIN attempt for deposit', { userId });
            return NextResponse.json({ message: 'Invalid PIN. Please try again.' }, { status: 401 });
        }

        // PRIMARY: Process deposit via VFD
        logger.info('[DEPOSIT] Processing via VFD...', { reference });
        const vfdResult = await processVFDDeposit(
            userData.phone,
            userPin,
            amount,
            reference,
            paymentMethod as 'card' | 'bank_transfer' | 'ussd',
            cardDetails
        );

        if (!vfdResult.success) {
            // Try to query if it's a timing issue
            await new Promise(r => setTimeout(r, 2000));
            const queryResult = await queryVFDTransaction(reference);
            if (!queryResult.success) {
                logger.error('[DEPOSIT] VFD deposit failed:', vfdResult);
                return NextResponse.json({ message: vfdResult.message || 'Deposit failed at payment gateway' }, { status: 400 });
            }
        }

        // SECONDARY: Update balance in Supabase
        try {
            const amountKobo = Math.round(amount * 100);
            const newBalance = userData.balance + amountKobo;

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
                    category: 'funding',
                    type: 'credit',
                    amount: amountKobo,
                    reference: reference,
                    narration: `Fund account via ${paymentMethod}`,
                    party: { method: paymentMethod },
                    balance_after: newBalance,
                });

            // Create notification using helper with template
            const notifSuccess = await createNotification({
                userId,
                ...NotificationTemplates.depositReceived(amountKobo, paymentMethod),
                reference,
            });

            if (!notifSuccess) {
                logger.error('[DEPOSIT] Failed to create notification');
            } else {
                logger.info('[DEPOSIT] Notification created successfully');
            }

            logger.info('[DEPOSIT] Backed up to Supabase', { reference });
        } catch (backupError) {
            logger.warn('[DEPOSIT] Supabase backup failed (non-blocking):', backupError);
        }

        return NextResponse.json({
            message: 'Deposit successful!',
            data: {
                amount: amount,
                reference: reference,
                newBalance: userData.balance + amount,
                timestamp: new Date().toISOString(),
            }
        }, { status: 200 });

    } catch (error) {
        logger.error('Deposit Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
    }
}
