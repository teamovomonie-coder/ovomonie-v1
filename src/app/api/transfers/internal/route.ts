import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { validatePayment } from '@/lib/payment-validator';
import { z } from 'zod';

// Vercel serverless function configuration
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const transferSchema = z.object({
  recipientAccountNumber: z.string().min(10),
  amount: z.number().positive(),
  narration: z.string().optional(),
  clientReference: z.string().optional(),
  senderPin: z.string().optional()
});

export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            logger.error('Supabase admin client not available');
            return NextResponse.json({ ok: false, message: 'Service unavailable' }, { status: 503 });
        }

        // Fetch internal transfer history for the user
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'internal_transfer')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            logger.error('Failed to fetch internal transfers', { error, userId });
            return NextResponse.json({ ok: false, message: 'Failed to fetch transfers' }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            data: data || []
        });

    } catch (error) {
        logger.error('Internal transfer GET error', { error });
        return NextResponse.json({ 
            ok: false, 
            message: 'Internal server error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        
        // Validate input
        const inputValidation = transferSchema.safeParse(body);
        if (!inputValidation.success) {
            return NextResponse.json({ 
                ok: false, 
                message: 'Invalid request data',
                errors: inputValidation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { recipientAccountNumber, amount, narration } = inputValidation.data;
        const clientReference = inputValidation.data.clientReference || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (!supabaseAdmin) {
            logger.error('Supabase admin client not available');
            return NextResponse.json({ ok: false, message: 'Service unavailable' }, { status: 503 });
        }

        // Convert to kobo
        const amountKobo = Math.round(amount * 100);

        // Validate payment restrictions
        const validation = await validatePayment(userId, amountKobo, recipientAccountNumber, narration, 'transfer');
        if (!validation.allowed) {
            return NextResponse.json({ ok: false, message: validation.reason }, { status: 403 });
        }

        // Simple internal transfer without stored procedure
        const { data: senderData, error: senderError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (senderError || !senderData) {
            logger.error('Sender not found', { error: senderError, userId });
            return NextResponse.json({ ok: false, message: 'Sender not found' }, { status: 404 });
        }

        const senderBalance = senderData.balance_kobo || senderData.balance || 0;
        if (senderBalance < amountKobo) {
            return NextResponse.json({ ok: false, message: 'Insufficient balance' }, { status: 400 });
        }

        const { data: recipientData, error: recipientError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('account_number', recipientAccountNumber)
            .single();

        if (recipientError || !recipientData) {
            logger.error('Recipient not found', { error: recipientError, recipientAccountNumber });
            return NextResponse.json({ ok: false, message: 'Recipient not found' }, { status: 404 });
        }

        if (recipientData.id === userId) {
            return NextResponse.json({ ok: false, message: 'Cannot transfer to yourself' }, { status: 400 });
        }

        const balanceField = senderData.balance_kobo !== undefined ? 'balance_kobo' : 'balance';
        const newSenderBalance = senderBalance - amountKobo;
        const recipientBalance = recipientData.balance_kobo || recipientData.balance || 0;
        const newRecipientBalance = recipientBalance + amountKobo;

        // Update sender balance
        const { error: updateSenderError } = await supabaseAdmin
            .from('users')
            .update({ [balanceField]: newSenderBalance })
            .eq('id', userId);

        if (updateSenderError) {
            logger.error('Failed to update sender balance', { error: updateSenderError, userId });
            return NextResponse.json({ ok: false, message: 'Transfer failed' }, { status: 500 });
        }

        // Update recipient balance
        const { error: updateRecipientError } = await supabaseAdmin
            .from('users')
            .update({ [balanceField]: newRecipientBalance })
            .eq('id', recipientData.id);

        if (updateRecipientError) {
            logger.error('Failed to update recipient balance', { error: updateRecipientError, recipientId: recipientData.id });
            // Rollback sender balance
            await supabaseAdmin
                .from('users')
                .update({ [balanceField]: senderBalance })
                .eq('id', userId);
            return NextResponse.json({ ok: false, message: 'Transfer failed' }, { status: 500 });
        }

        // Create transaction record
        const { error: transactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId,
                type: 'internal_transfer',
                amount_kobo: amountKobo,
                reference: clientReference,
                status: 'completed',
                metadata: {
                    recipient_id: recipientData.id,
                    recipient_name: recipientData.full_name || recipientData.fullName,
                    recipient_account: recipientAccountNumber,
                    narration: narration || 'Internal transfer'
                }
            });

        if (transactionError) {
            logger.error('Failed to create transaction record', { error: transactionError });
        }

        logger.info('Internal transfer successful', {
            userId,
            recipientAccountNumber,
            amount: amountKobo,
            reference: clientReference
        });

        return NextResponse.json({
            ok: true,
            message: 'Transfer successful!',
            data: {
                newBalanceInKobo: newSenderBalance,
                transactionId: clientReference,
                recipientName: recipientData.full_name || recipientData.fullName,
                amount: amount,
                reference: clientReference
            }
        });

    } catch (error) {
        logger.error('Internal transfer error', { error, userId: getUserIdFromToken() });
        return NextResponse.json({ 
            ok: false, 
            message: 'Internal server error'
        }, { status: 500 });
    }
}