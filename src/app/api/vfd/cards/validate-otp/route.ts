import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { getVFDHeaders } from '@/lib/vfd-auth';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const VFD_CARDS_BASE = process.env.VFD_CARDS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

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
    const { reference, otp } = body;
    
    if (!reference || !otp) {
      return NextResponse.json({ ok: false, message: 'Missing reference or otp' }, { status: 400 });
    }

    const headers = await getVFDHeaders();
    
    logger.info('VFD OTP: Validating', { reference });

    const response = await fetch(`${VFD_CARDS_BASE}/validate-otp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ otp, reference }),
    });

    const text = await response.text();
    logger.info('VFD OTP: Response', { status: response.status, body: text });

    let result: any;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      logger.error('VFD OTP: Failed to parse response', { text });
      result = {};
    }
    
    const success = result.status === '00' || response.ok;
    let newBalance = null;
    
    // If successful, process pending payment
    if (success) {
      const { data: pendingPayment } = await supabase
        .from('pending_payments')
        .select('amount')
        .eq('reference', reference)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (pendingPayment?.amount) {
        const amountInKobo = pendingPayment.amount;
        logger.info('VFD OTP: Processing payment', { amountInKobo, reference });
        
        const { data: userData } = await supabase
          .from('users')
          .select('balance')
          .eq('id', userId)
          .single();
        
        if (userData) {
          newBalance = (userData.balance || 0) + amountInKobo;
          
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
          
          logger.info('VFD OTP: Payment completed', { newBalance });
        }
      }
    }
    
    return NextResponse.json({
      ok: success,
      message: result.message || result.narration || (success ? 'Payment completed' : 'Payment failed'),
      data: result.data,
      newBalanceInKobo: newBalance,
      vfdStatus: result.status,
    }, { status: success ? 200 : 400 });
  } catch (err: any) {
    logger.error('VFD OTP: Error', { error: err.message });
    return NextResponse.json({ ok: false, message: err.message || 'OTP validation failed' }, { status: 500 });
  }
}
