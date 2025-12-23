import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

const CARD_FEE_KOBO = 1500_00; // ₦1,500

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that the card order request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('card order request received', { authPresent: Boolean(authHeader), path: '/api/cards/order' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in card order');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { nameOnCard, designType, designValue, shippingInfo, clientReference } = await request.json();

        if (!nameOnCard || !designType || !designValue || !shippingInfo || !clientReference) {
            return NextResponse.json({ message: 'Missing required order fields.' }, { status: 400 });
        }
        
        let newBalance = 0;

        if (!supabaseAdmin) {
            throw new Error('Database connection not available');
        }

        // Idempotency: check if this clientReference was already processed
        const { data: existingOrder } = await supabaseAdmin
            .from('card_orders')
            .select('id')
            .eq('client_reference', clientReference)
            .limit(1);

        if (existingOrder && existingOrder.length > 0) {
            logger.info(`Idempotent request for card order: ${clientReference} already processed.`);
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('balance')
                .eq('id', userId)
                .single();
            
            newBalance = user?.balance || 0;
            return NextResponse.json({ message: 'Card order already processed.', newBalanceInKobo: newBalance }, { status: 200 });
        }

        // Start transaction
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            throw new Error("User not found.");
        }

        if (user.balance < CARD_FEE_KOBO) {
            throw new Error("Insufficient funds to order a custom card.");
        }
        
        newBalance = user.balance - CARD_FEE_KOBO;

        // Update user balance
        const { error: balanceError } = await supabaseAdmin
            .from('users')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (balanceError) throw balanceError;

        // Create card order
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('card_orders')
            .insert({
                user_id: userId,
                name_on_card: nameOnCard,
                design_type: designType,
                design_value: designValue,
                shipping_info: shippingInfo,
                client_reference: clientReference,
                status: 'Processing',
                created_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (orderError) throw orderError;

        // Log the debit transaction
        const { error: txnError } = await supabaseAdmin
            .from('financial_transactions')
            .insert({
                user_id: userId,
                category: 'card',
                type: 'debit',
                amount: CARD_FEE_KOBO,
                reference: `CARD-ORDER-${orderData.id}`,
                narration: 'Custom ATM card order',
                party_name: 'Ovomonie Card Services',
                timestamp: new Date().toISOString(),
                balance_after: newBalance,
            });

        if (txnError) throw txnError;

        return NextResponse.json({
            message: 'Card order placed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        logger.error("Card Order Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}