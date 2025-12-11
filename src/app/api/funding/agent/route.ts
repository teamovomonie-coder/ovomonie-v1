import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, agentId, clientReference } = await request.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
    }
    if (!agentId) {
      return NextResponse.json({ message: 'Agent ID is required.' }, { status: 400 });
    }
    if (!clientReference) {
      return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
    }

    // Idempotency check
    const financialTransactionsRef = collection(db, 'financialTransactions');
    const idempotencyQuery = query(financialTransactionsRef, where('reference', '==', clientReference));
    const existing = await getDocs(idempotencyQuery as any).catch(() => null);
    if (existing && !(existing as any).empty) {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await (await import('firebase/firestore')).getDoc(userRef as any);
      const currentBal = userSnapshot.exists() ? (userSnapshot.data() as any)?.balance : null;
      return NextResponse.json({ message: 'Already processed', newBalanceInKobo: currentBal }, { status: 200 });
    }

    let newBalance = 0;
    const amountInKobo = Math.round(amount * 100);

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef as any);

      if (!userDoc.exists()) {
        throw new Error('User document does not exist.');
      }

      const userData = userDoc.data();
      newBalance = userData.balance + amountInKobo;

      transaction.update(userRef, { balance: newBalance });

      const creditLog = {
        userId,
        category: 'deposit',
        type: 'credit',
        amount: amountInKobo,
        reference: clientReference,
        narration: `Agent deposit from ${agentId}`,
        party: { name: `Agent ${agentId}` },
        timestamp: serverTimestamp(),
        balanceAfter: newBalance,
      };
      transaction.set(doc(financialTransactionsRef), creditLog);
    });

    return NextResponse.json(
      { message: 'Agent deposit successful!', newBalanceInKobo: newBalance },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Agent funding error', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
