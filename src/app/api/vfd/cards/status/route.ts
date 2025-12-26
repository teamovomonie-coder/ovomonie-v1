import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getVFDHeaders } from '@/lib/vfd-auth';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const VFD_CARDS_BASE = process.env.VFD_CARDS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers as any);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Missing reference parameter' }, { status: 400 });
    }

    const headers = await getVFDHeaders();
    
    logger.info('VFD Status: Checking', { reference });

    const response = await fetch(`${VFD_CARDS_BASE}/payment-details?reference=${encodeURIComponent(reference)}`, {
      headers,
    });

    const text = await response.text();
    logger.info('VFD Status: Response', { status: response.status, body: text });

    let result: any;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      logger.error('VFD Status: Failed to parse response', { text });
      return NextResponse.json({ ok: false, message: 'Invalid response from payment gateway' }, { status: 500 });
    }
    
    const success = result.status === '00' && (result.data?.transactionStatus === '00' || result.data?.status === '00');
    
    // Update balance and create transaction if payment successful
    let newBalance = null;
    if (success && supabase) {
      let amountInKobo = 0;
      
      // Try to get amount from VFD response first
      if (result.data?.amount) {
        amountInKobo = Math.round(parseFloat(result.data.amount) * 100);
      } else {
        // Fallback: get from pending_payments
        const { data: pendingPayment } = await supabase
          .from('pending_payments')
          .select('amount')
          .eq('reference', reference)
          .maybeSingle();
        
        if (pendingPayment?.amount) {
          amountInKobo = pendingPayment.amount;
          logger.info('VFD Status: Using amount from pending_payments', { amountInKobo });
        }
      }
      
      if (amountInKobo > 0) {
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
          
          logger.info('VFD Status: Balance updated', { newBalance });
          
          // Create transaction record (check for duplicates first)
          const { data: existingTxn } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('reference', reference)
            .maybeSingle();
          
          if (!existingTxn) {
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
            logger.info('VFD Status: Transaction created', { reference });
          }
          
          // Mark pending payment as completed
          await supabase
            .from('pending_payments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('reference', reference);
          
          logger.info('VFD Status: Pending payment marked completed', { reference });
          
          // Create notification
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
        }
      }
    }
    
    return NextResponse.json({
      ok: success,
      message: result.message || result.data?.transactionMessage || 'Status retrieved',
      data: {
        status: result.data?.transactionStatus || result.data?.status,
        message: result.data?.transactionMessage || result.data?.message,
        amount: result.data?.amount,
        reference: result.data?.reference,
        description: result.data?.transactionDescription || result.data?.description,
      },
      newBalanceInKobo: newBalance,
    }, { status: success ? 200 : 400 });
  } catch (err: any) {
    logger.error('VFD Status: Error', { error: err.message });
    return NextResponse.json({ ok: false, message: err.message || 'Status check failed' }, { status: 500 });
  }
}
