import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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
    
    const body = await req.json();
    const { reference } = body;
    
    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Missing reference' }, { status: 400 });
    }

    const { data: pendingPayment } = await supabase
      .from('pending_payments')
      .select('amount')
      .eq('reference', reference)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (!pendingPayment) {
      return NextResponse.json({ ok: false, message: 'Payment not found or already completed' }, { status: 404 });
    }
    
    const amountInKobo = pendingPayment.amount;
    
    const { data: userData } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();
    
    if (!userData) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }
    
    const newBalance = (userData.balance || 0) + amountInKobo;
    
    await supabase
      .from('users')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    await supabase.from('financial_transactions').insert({
      user_id: userId,
      type: 'credit',
      category: 'deposit',
      amount: amountInKobo,
      reference,
      narration: 'Card funding via VFD',
      party: { method: 'card', gateway: 'VFD' },
      balance_after: newBalance,
      timestamp: new Date().toISOString()
    });
    
    await supabase
      .from('pending_payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('reference', reference);
    
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Wallet Funded',
      body: `Your wallet has been credited with ₦${(amountInKobo / 100).toLocaleString()}`,
      category: 'transaction',
      type: 'credit',
      amount: amountInKobo,
      reference,
      read: false,
      created_at: new Date().toISOString()
    });
    
    logger.info('Manual payment completion', { reference, newBalance });
    
    return NextResponse.json({
      ok: true,
      message: 'Payment completed successfully',
      newBalanceInKobo: newBalance,
    }, { status: 200 });
  } catch (err: any) {
    logger.error('Manual payment completion error', { error: err.message });
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
