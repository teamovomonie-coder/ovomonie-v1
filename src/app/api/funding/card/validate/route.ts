import { NextResponse } from 'next/server';
import { validateOtp, paymentDetails } from '@/lib/vfd';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { otp, reference } = await request.json();
    if (!otp || !reference) return NextResponse.json({ message: 'otp and reference are required' }, { status: 400 });

    const res = await validateOtp(otp, reference);
    logger.debug('VFD validate-otp response', { res });

    // After validating OTP, fetch payment details
    const details = await paymentDetails(reference);
    logger.debug('VFD payment-details', { details });

    const serviceCode = details?.data?.data?.serviceResponseCodes || details?.data?.serviceResponseCodes || null;

    let newBalanceInKobo: number | null = null;
    if (serviceCode === 'COMPLETED' && supabaseAdmin) {
      // find pending transaction and finalize
      const { data: transactions } = await supabaseAdmin
        .from('financial_transactions')
        .select('id, user_id, amount')
        .eq('reference', reference)
        .limit(1);

      if (transactions && transactions.length > 0 && transactions[0]) {
        const tx = transactions[0];
        const userId = tx.user_id;
        const amount = tx.amount;

        if (!userId || !amount) return NextResponse.json({ success: res.ok, data: res.data, details, newBalanceInKobo }, { status: res.status || 200 });

        // Get user balance
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', userId)
          .single();

        if (user) {
          const newBal = (user.balance || 0) + amount;
          newBalanceInKobo = newBal;

          // Update user balance
          await supabaseAdmin
            .from('users')
            .update({ balance: newBal })
            .eq('id', userId);

          // Update transaction status
          await supabaseAdmin
            .from('financial_transactions')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString(), 
              balance_after: newBal 
            })
            .eq('id', tx.id);
        }
      }
    }

    return NextResponse.json({ success: res.ok, data: res.data, details, newBalanceInKobo }, { status: res.status || 200 });
  } catch (err) {
    logger.error('validate-otp error', err);
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}