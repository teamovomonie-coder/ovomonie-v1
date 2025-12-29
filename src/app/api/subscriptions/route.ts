import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (subscriptions || []).map(sub => ({
      id: sub.id,
      merchantName: sub.merchant_name,
      amount: sub.amount_kobo / 100,
      frequency: sub.frequency,
      nextBillingDate: sub.next_billing_date,
      status: sub.status
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    // Check if autopay is enabled
    const { data: settings } = await supabaseAdmin
      .from('payment_settings')
      .select('enable_autopay')
      .eq('user_id', userId)
      .maybeSingle();

    if (settings && !settings.enable_autopay) {
      return NextResponse.json({ message: 'Auto-pay is disabled. Enable it in payment settings to create subscriptions.' }, { status: 403 });
    }

    const body = await request.json();
    const { merchantName, amount, frequency, nextBillingDate } = body;

    if (!merchantName || !amount || !frequency) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const billingDate = nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        merchant_name: merchantName,
        amount_kobo: amount * 100,
        frequency,
        next_billing_date: billingDate,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      id: data.id,
      merchantName: data.merchant_name,
      amount: data.amount_kobo / 100,
      frequency: data.frequency,
      nextBillingDate: data.next_billing_date,
      status: data.status
    };

    return NextResponse.json({ message: 'Subscription created successfully', data: mapped }, { status: 201 });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
