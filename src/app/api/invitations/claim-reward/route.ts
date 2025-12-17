

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);
const REWARD_AMOUNT_KOBO = 500_00; // ₦500

function getUserIdFromRequest(request: Request) {
    // Try ovo-user-id header (sent from client)
    const userId = request.headers.get('x-ovo-user-id');
    if (userId) return userId;
    // Try query param (for dev/testing)
    const url = new URL(request.url);
    if (url.searchParams.has('userId')) return url.searchParams.get('userId');
    return null;
}

export async function POST(request: Request) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        // Fetch user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();
        if (userError || !user) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }
        const newBalance = (user.balance || 0) + REWARD_AMOUNT_KOBO;
        // Update user balance
        const { error: updateError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);
        if (updateError) {
            return NextResponse.json({ message: updateError.message }, { status: 500 });
        }
        // Optionally, log the transaction in a separate table
        await supabase.from('financial_transactions').insert([
            {
                user_id: userId,
                category: 'referral',
                type: 'credit',
                amount: REWARD_AMOUNT_KOBO,
                reference: `REF-REWARD-${Date.now()}`,
                narration: 'Referral reward claimed',
                party: { name: 'Ovomonie Rewards' },
                timestamp: new Date().toISOString(),
                balance_after: newBalance,
            },
        ]);
        return NextResponse.json({
            message: 'Reward claimed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });
    } catch (error) {
        logger.error('Reward Claim Error:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
