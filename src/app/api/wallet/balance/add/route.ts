import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers as any);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const { amountInKobo } = await req.json();

    if (!amountInKobo || amountInKobo <= 0) {
      return NextResponse.json({ ok: false, message: 'Invalid amount' }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance_kobo')
      .eq('id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    const newBalance = (userData.wallet_balance_kobo || 0) + amountInKobo;

    const { error } = await supabase
      .from('users')
      .update({ wallet_balance_kobo: newBalance })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to update balance' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, newBalanceInKobo: newBalance });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message || 'Failed to add balance' }, { status: 500 });
  }
}
