
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);


function getUserIdFromRequest(request: Request) {
  // Try ovo-user-id header (sent from client)
  const userId = request.headers.get('x-ovo-user-id');
  if (userId) return userId;
    // Try Authorization bearer token
    const auth = request.headers.get('authorization') || request.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        const payload = token ? verifyAuthToken(token) : null;
        if (payload && payload.sub) return payload.sub;
    }
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
        const { data: user, error } = await supabase
            .from('users')
            .select('id, referral_code, invites_count, signups_count, referral_earnings')
            .eq('id', userId)
            .single();
        if (error || !user) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
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
