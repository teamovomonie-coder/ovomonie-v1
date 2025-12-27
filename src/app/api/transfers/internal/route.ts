import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const transferSchema = z.object({
  recipientAccountNumber: z.string().min(10),
  amount: z.number().positive(),
  narration: z.string().optional(),
  clientReference: z.string().optional(),
  senderPin: z.string().optional()
});

export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        
        // Validate input
        const validation = transferSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ 
                ok: false, 
                message: 'Invalid request data',
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { recipientAccountNumber, amount, narration } = validation.data;
        const clientReference = validation.data.clientReference || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (!supabaseAdmin) {
            logger.error('Supabase admin client not available');
            return NextResponse.json({ ok: false, message: 'Service unavailable' }, { status: 503 });
        }

        // Convert to kobo
        const amountKobo = Math.round(amount * 100);

        // Use database transaction to ensure atomicity
        const { data, error } = await supabaseAdmin.rpc('process_internal_transfer', {
            p_sender_id: userId,
            p_recipient_account: recipientAccountNumber,
            p_amount_kobo: amountKobo,
            p_narration: narration || 'Internal transfer',
            p_reference: clientReference
        });

        if (error) {
            logger.error('Internal transfer failed', { error, userId, recipientAccountNumber, amount: amountKobo });
            
            // Handle specific error cases
            if (error.message?.includes('Insufficient balance')) {
                return NextResponse.json({ ok: false, message: 'Insufficient balance' }, { status: 400 });
            }
            if (error.message?.includes('Recipient not found')) {
                return NextResponse.json({ ok: false, message: 'Recipient not found' }, { status: 404 });
            }
            if (error.message?.includes('Cannot transfer to yourself')) {
                return NextResponse.json({ ok: false, message: 'Cannot transfer to yourself' }, { status: 400 });
            }
            if (error.message?.includes('Duplicate transaction')) {
                return NextResponse.json({ ok: false, message: 'Duplicate transaction' }, { status: 409 });
            }
            
            return NextResponse.json({ ok: false, message: 'Transfer failed' }, { status: 500 });
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
                newBalanceInKobo: data.new_sender_balance,
                transactionId: clientReference,
                recipientName: data.recipient_name,
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