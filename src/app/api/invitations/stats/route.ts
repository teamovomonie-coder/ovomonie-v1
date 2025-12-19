
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

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
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        let user: any = null;
        // First try exact id match
        let resp: any = await supabase
            .from('users')
            .select('id, referral_code, invites_count, signups_count, referral_earnings')
            .eq('id', userId)
            .maybeSingle();
        if (resp?.data) {
            user = resp.data;
        } else {
            // Fallback: try matching common alternate identifiers (phone, account_number)
            try {
                const alt = await supabase
                    .from('users')
                    .select('id, referral_code, invites_count, signups_count, referral_earnings')
                    .or(`phone.eq.${userId},account_number.eq.${userId}`)
                    .limit(1)
                    .maybeSingle();
                if (alt?.data) user = alt.data;
            } catch (e) {
                // ignore and proceed to error return below
            }
        }
        if (!user) {
            const xHeaderPresent = !!request.headers.get('x-ovo-user-id');
            const authHeader = request.headers.get('authorization');
            const parsedFromToken = getUserIdFromToken(request.headers as any);
            logger.info('invitations.stats: user lookup failed', { provided: userId, xHeaderPresent, hasAuthHeader: !!authHeader, parsedFromToken: parsedFromToken ?? null });

            // Additional fallback: if provided id looks like a phone, try suffix match
            try {
                const cleaned = String(userId || '').replace(/\D/g, '');
                if (cleaned.length >= 7) {
                    const last7 = cleaned.slice(-7);
                    const like = await supabase
                        .from('users')
                        .select('id, referral_code, invites_count, signups_count, referral_earnings')
                        .ilike('phone', `%${last7}`)
                        .limit(1)
                        .maybeSingle();
                    if (like?.data) {
                        user = like.data;
                    }
                }
            } catch (e) {
                logger.debug('phone suffix lookup failed', e);
            }

            if (!user) {
                return NextResponse.json({ message: 'User not found.', details: { provided: userId, xHeaderPresent: xHeaderPresent, hasAuthHeader: !!authHeader, parsedFromToken: parsedFromToken ?? null } }, { status: 404 });
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
