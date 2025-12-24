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
    const userId = await getUserIdFromToken(headers());
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('crypto_assets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ assets: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { symbol, name, amount, purchase_price } = await request.json();

    // Mock current price (in production, fetch from crypto API)
    const current_price = purchase_price * (0.9 + Math.random() * 0.2);

    const { data, error } = await supabase
      .from('crypto_assets')
      .insert({
        user_id: userId,
        symbol,
        name,
        amount,
        purchase_price,
        current_price
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ asset: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}