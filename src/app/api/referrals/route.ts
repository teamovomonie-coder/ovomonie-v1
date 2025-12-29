import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const headersList = headers();
    const userId = getUserIdFromToken(headersList);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;
    return NextResponse.json({ referrals: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userId = getUserIdFromToken(headersList);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { referee_id } = await request.json();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: userId,
        referee_id,
        code,
        status: 'pending',
        reward_amount: 1000
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ referral: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}