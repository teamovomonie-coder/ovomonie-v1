
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { getUserById } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);


function getUserIdFromRequest(request: Request) {
    // Prefer explicit header if provided
    const userId = request.headers.get('x-ovo-user-id');
    if (userId) return userId;
    // Try Authorization bearer token using shared helper (handles Firebase & legacy tokens)
    const maybe = getUserIdFromToken(request.headers as any);
    if (maybe) return maybe;
    // Try query param (for dev/testing)
    const url = new URL(request.url);
    if (url.searchParams.has('userId')) return url.searchParams.get('userId');
    return null;
}

export async function GET(request: Request) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        // Use centralized user retrieval which can fallback to Firestore
        let user = await getUserById(userId);
        if (!user) {
            const xHeaderPresent = !!request.headers.get('x-ovo-user-id');
            const authHeader = request.headers.get('authorization');
            const parsedFromToken = getUserIdFromToken(request.headers as any);
            logger.info('invitations.stats: user not found in primary store, attempting supabase fallback/upsert', { provided: userId, xHeaderPresent, hasAuthHeader: !!authHeader, parsedFromToken: parsedFromToken ?? null });

            // Try Supabase direct fallback: id or phone/account match (legacy)
            try {
                const resp: any = await supabase
                    .from('users')
                    .select('id, referral_code, invites_count, signups_count, referral_earnings')
                    .or(`id.eq.${userId},phone.eq.${userId},account_number.eq.${userId}`)
                    .limit(1)
                    .maybeSingle();
                if (resp?.data) user = resp.data;
            } catch (e) {
                logger.debug('supabase fallback lookup failed', e);
            }

            // If still not found, attempt to create a minimal user record in Supabase
            if (!user) {
                try {
                    const generatedCode = (Math.random().toString(36).substring(2, 10) + Date.now().toString(36)).toUpperCase().slice(0,8);
                    const insertResp: any = await supabase
                        .from('users')
                        .insert([{ id: userId, referral_code: generatedCode, invites_count: 0, signups_count: 0, referral_earnings: 0 }])
                        .select('id, referral_code, invites_count, signups_count, referral_earnings')
                        .maybeSingle();
                    if (insertResp?.error) {
                        logger.error('Failed to insert minimal user in supabase:', insertResp.error);
                    } else if (insertResp?.data) {
                        user = insertResp.data;
                    }
                } catch (e) {
                    logger.error('Supabase insert for missing user failed', e);
                }
            }

            if (!user) {
                return NextResponse.json({ message: 'User not found and automatic creation failed. Ensure `users` table exists in Supabase.' }, { status: 404 });
            }
        }

        // If user has no referral_code, generate one and persist it
        let referralCode = user.referral_code;
        if (!referralCode) {
            // generate an 8-char alphanumeric code
            referralCode = (Math.random().toString(36).substring(2, 10) + Date.now().toString(36)).toUpperCase().slice(0,8);
            const { error: updateError } = await supabase
                .from('users')
                .update({ referral_code: referralCode })
                .eq('id', userId);
            if (updateError) {
                // log but continue to return the generated code in-memory
                logger.error('Failed to persist referral code:', updateError);
            }
        }
        const stats = {
            invites: user.invites_count ?? 0,
            signups: user.signups_count ?? 0,
            earnings: user.referral_earnings ?? 0,
        };
        return NextResponse.json({
            referralCode,
            stats,
        });
    } catch (error) {
        logger.error('Error fetching invitation stats:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
