import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { initiatePaystackTransaction, verifyPaystackTransaction } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, amount, reference, email, clientReference } = body;

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

      // Create pending transaction record
      const financialTransactionsRef = collection(db, 'financialTransactions');
      const pending = {
        userId,
        category: 'deposit',
        type: 'credit',
        amount: amountInKobo,
        reference: clientReference || reference,
        narration: 'Card deposit via Paystack (pending)',
        party: { name: 'Paystack' },
        status: 'pending',
        provider: 'paystack',
        providerReference: reference,
        createdAt: serverTimestamp(),
      };
      const pendingRef = await addDoc(financialTransactionsRef, pending as any);
      logger.debug('Created pending Paystack transaction', { pendingRef: pendingRef.id });

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

      // Finalize in Firestore
      let newBalance = 0;
      const financialTransactionsRef = collection(db, 'financialTransactions');
      const pendingQuery = query(
        financialTransactionsRef,
        where('providerReference', '==', reference),
        where('status', '==', 'pending')
      );
      const pendingDocs = await getDocs(pendingQuery);

      await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await tx.get(userRef as any);
        if (!userDoc.exists()) throw new Error('User not found');

        const userData = userDoc.data();
        newBalance = (userData.balance || 0) + amountInKobo;
        tx.update(userRef, { balance: newBalance });

        // Update pending transaction to completed
        for (const pendingDoc of pendingDocs.docs) {
          tx.update(pendingDoc.ref, {
            status: 'completed',
            completedAt: serverTimestamp(),
            balanceAfter: newBalance,
            providerData: transactionData,
          });
        }
      });

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
