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

    let { data: settings, error } = await supabaseAdmin
      .from('payment_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!settings) {
      const { data: newSettings, error: insertError } = await supabaseAdmin
        .from('payment_settings')
        .insert({ user_id: userId })
        .select()
        .single();

      if (insertError) throw insertError;
      settings = newSettings;
    }

    return NextResponse.json({
      dailyLimit: settings.daily_limit_kobo / 100,
      singleTransactionLimit: settings.single_transaction_limit_kobo / 100,
      blockInternational: settings.block_international,
      blockGambling: settings.block_gambling,
      enableOnlinePayments: settings.enable_online_payments,
      enableContactless: settings.enable_contactless,
      enableAutopay: settings.enable_autopay,
      requirePinAbove: settings.require_pin_above_kobo / 100
    });
  } catch (error) {
    logger.error('Error fetching payment settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (body.dailyLimit !== undefined) updateData.daily_limit_kobo = body.dailyLimit * 100;
    if (body.singleTransactionLimit !== undefined) updateData.single_transaction_limit_kobo = body.singleTransactionLimit * 100;
    if (body.blockInternational !== undefined) updateData.block_international = body.blockInternational;
    if (body.blockGambling !== undefined) updateData.block_gambling = body.blockGambling;
    if (body.enableOnlinePayments !== undefined) updateData.enable_online_payments = body.enableOnlinePayments;
    if (body.enableContactless !== undefined) updateData.enable_contactless = body.enableContactless;
    if (body.enableAutopay !== undefined) updateData.enable_autopay = body.enableAutopay;
    if (body.requirePinAbove !== undefined) updateData.require_pin_above_kobo = body.requirePinAbove * 100;

    const { data, error } = await supabaseAdmin
      .from('payment_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Settings updated successfully', data });
  } catch (error) {
    logger.error('Error updating payment settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
