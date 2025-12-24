import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { initiatePaystackTransaction, verifyPaystackTransaction, resolveBankAccount } from '@/lib/paystack';
import { userService, transactionService } from '@/lib/db';
=======
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { initiatePaystackTransaction, verifyPaystackTransaction, resolveBankAccount } from '@/lib/paystack';
import { supabaseAdmin } from '@/lib/supabase';
>>>>>>> f903fae907e75606307fe15fc6b05a04460c0c7d

export async function POST(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, amount, reference, email, clientReference, accountNumber, bankCode } = body;

    // Action: Resolve bank account and return account name
    if (action === 'resolveAccount') {
      if (!accountNumber || !bankCode) {
        return NextResponse.json({ message: 'accountNumber and bankCode are required.' }, { status: 400 });
      }
      const resolved = await resolveBankAccount(accountNumber, bankCode);
      if (!resolved.ok) {
        return NextResponse.json(resolved.data || { message: 'Unable to resolve account' }, { status: resolved.status });
      }
      return NextResponse.json({ ok: true, data: resolved.data }, { status: 200 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    // Action 1: Initialize a Paystack transaction
    if (action === 'initialize') {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ message: 'Valid positive amount is required.' }, { status: 400 });
      }
      if (!email) {
        return NextResponse.json({ message: 'Email is required for Paystack payment.' }, { status: 400 });
      }
      if (!reference) {
        return NextResponse.json({ message: 'Reference is required.' }, { status: 400 });
      }

      const amountInKobo = Math.round(amount * 100);
      const initiation = await initiatePaystackTransaction({
        amount: amountInKobo,
        email,
        reference,
        metadata: { userId, clientReference },
      });

      logger.debug('Paystack initiation', { initiation });

      if (!initiation.ok) {
        return NextResponse.json(initiation.data || { message: 'Paystack initialization failed' }, { status: initiation.status });
      }

<<<<<<< HEAD
      // Create pending transaction record in Supabase
      await transactionService.create({
        user_id: userId,
        category: 'deposit',
        type: 'credit',
        amount: amountInKobo,
        reference: clientReference || reference,
        narration: 'Card deposit via Paystack (pending)',
        party: { name: 'Paystack' },
        balance_after: 0,
      });
      logger.debug('Created pending Paystack transaction', { reference });
=======
      // Create pending transaction record
      const { data: pendingTx } = await supabaseAdmin
        .from('financial_transactions')
        .insert({
          user_id: userId,
          category: 'deposit',
          type: 'credit',
          amount: amountInKobo,
          reference: clientReference || reference,
          narration: 'Card deposit via Paystack (pending)',
          party_name: 'Paystack',
          timestamp: new Date().toISOString(),
          metadata: {
            status: 'pending',
            provider: 'paystack',
            providerReference: reference,
          }
        })
        .select('id')
        .single();

      logger.debug('Created pending Paystack transaction', { pendingRef: pendingTx?.id });
>>>>>>> f903fae907e75606307fe15fc6b05a04460c0c7d

      return NextResponse.json({
        message: 'Paystack transaction initialized',
        authorizationUrl: initiation.data?.data?.authorization_url,
        reference: initiation.data?.data?.reference,
        newBalanceInKobo: null, // Will update after verification
      }, { status: 200 });
    }

    // Action 2: Verify and finalize a Paystack transaction
    if (action === 'verify') {
      if (!reference) {
        return NextResponse.json({ message: 'Reference is required for verification.' }, { status: 400 });
      }

      const verification = await verifyPaystackTransaction(reference);
      logger.debug('Paystack verification', { verification });

      if (!verification.ok) {
        return NextResponse.json(
          verification.data || { message: 'Paystack verification failed' },
          { status: verification.status }
        );
      }

      const transactionData = verification.data?.data;
      if (!transactionData || transactionData.status !== 'success') {
        return NextResponse.json(
          { message: 'Paystack transaction not completed.' },
          { status: 400 }
        );
      }

      // Extract amount from Paystack response (in kobo)
      const amountInKobo = transactionData.amount || 0;

<<<<<<< HEAD
      // Finalize in Supabase
      const user = await userService.getById(userId);
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amountInKobo;
      
      // Update user balance
      await userService.updateBalance(userId, newBalance);
      
      // Create completed transaction
      await transactionService.create({
        user_id: userId,
        category: 'deposit',
        type: 'credit',
        amount: amountInKobo,
        reference: `${reference}-completed`,
        narration: 'Card deposit via Paystack',
        party: { name: 'Paystack' },
        balance_after: newBalance,
      });
      
      logger.info('Paystack funding completed', { userId, amount: amountInKobo, newBalance });
=======
      // Get pending transactions
      const { data: pendingTxs } = await supabaseAdmin
        .from('financial_transactions')
        .select('id')
        .eq('reference', reference)
        .eq('metadata->>status', 'pending');

      // Get user and update balance
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
      const newBalance = currentBalance + amountInKobo;

      // Update user balance
      await supabaseAdmin
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      // Update pending transactions to completed
      if (pendingTxs && pendingTxs.length > 0) {
        await supabaseAdmin
          .from('financial_transactions')
          .update({
            balance_after: newBalance,
            metadata: {
              status: 'completed',
              provider: 'paystack',
              providerReference: reference,
              providerData: transactionData,
              completedAt: new Date().toISOString()
            }
          })
          .in('id', pendingTxs.map(tx => tx.id));
      }
>>>>>>> f903fae907e75606307fe15fc6b05a04460c0c7d

      return NextResponse.json(
        {
          message: 'Funding successful via Paystack!',
          newBalanceInKobo: newBalance,
          reference,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    logger.error('funding/paystack error', err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}