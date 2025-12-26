import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { authorizeCardPin } from '@/lib/vfd';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { pinRateLimiter } from '@/lib/middleware/pin-rate-limiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers as any);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if account is locked
    const lockoutCheck = pinRateLimiter.checkLockout(userId, 'authorization');
    if (lockoutCheck) {
      return NextResponse.json({ ok: false, message: 'Too many failed attempts. Please try again later.' }, { status: 429 });
    }
    
    const body = await req.json();
    const { reference, cardPin } = body;
    if (!reference || !cardPin) {
      return NextResponse.json({ ok: false, message: 'Missing reference or cardPin' }, { status: 400 });
    }

    const res = await authorizeCardPin({ reference, pin: cardPin });
    
    // Handle PIN failure
    if (!res.ok) {
      const result = pinRateLimiter.recordFailure(userId, 'authorization');
      
      logger.warn('Card PIN authorization failed', {
        userId,
        reference,
        remainingAttempts: result.remainingAttempts
      });
      
      if (result.locked) {
        return NextResponse.json(
          { ok: false, message: 'Too many failed attempts. Account locked for 30 minutes.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { 
          ok: false, 
          message: `Invalid card PIN. ${result.remainingAttempts} attempt(s) remaining.` 
        },
        { status: 400 }
      );
    }
    
    // Success - reset failure counter
    pinRateLimiter.recordSuccess(userId, 'authorization');
    
    // Update balance if successful
    let newBalance = null;
    if (res.ok && supabase) {
      const { data: pendingPayment } = await supabase
        .from('pending_payments')
        .select('amount')
        .eq('reference', reference)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (pendingPayment?.amount) {
        const amountInKobo = pendingPayment.amount;
        logger.info('VFD Authorize PIN: Found pending payment', { amountInKobo, reference });
        
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
          
          logger.info('VFD Authorize PIN: Balance updated', { newBalance });
          
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
          
          logger.info('VFD Authorize PIN: Transaction completed', { reference });
        }
      }
    }
    
    return NextResponse.json({ ...res, newBalanceInKobo: newBalance }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('VFD Authorize PIN: Error', { error: message });
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
