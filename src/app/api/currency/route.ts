import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'NGN';

    // Mock exchange rates (in production, use real API)
    const rates: Record<string, number> = {
      'USD-NGN': 1650,
      'EUR-NGN': 1800,
      'GBP-NGN': 2100,
      'NGN-USD': 0.00061,
      'NGN-EUR': 0.00056,
      'NGN-GBP': 0.00048
    };

    const key = `${from}-${to}`;
    const rate = rates[key] || 1;

    const { data, error } = await supabase
      .from('currency_rates')
      .upsert({
        from_currency: from,
        to_currency: to,
        rate,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rate: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rate' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { from_currency, to_currency, amount } = await request.json();
    
    const rateResponse = await fetch(`${request.nextUrl.origin}/api/currency?from=${from_currency}&to=${to_currency}`);
    const { rate } = await rateResponse.json();
    
    const converted_amount = amount * rate.rate;
    
    return NextResponse.json({ 
      from_currency,
      to_currency,
      amount,
      converted_amount,
      rate: rate.rate
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to convert currency' }, { status: 500 });
  }
}