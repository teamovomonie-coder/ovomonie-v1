import { NextResponse } from 'next/server';
import { validateOtp, paymentDetails } from '@/lib/vfd';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { collection, query, where, getDocs, doc, serverTimestamp, runTransaction } from 'firebase/firestore';

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
    if (serviceCode === 'COMPLETED') {
      // find pending transaction and finalize
      const financialTransactionsRef = collection(db, 'financialTransactions');
      const q = query(financialTransactionsRef, where('reference', '==', reference));
      const snaps = await getDocs(q as any);
      if (!snaps.empty) {
        const txDoc = snaps.docs[0];
        const txData = txDoc.data() as any;
        const userId = txData.userId;
        const amount = txData.amount;
        const txRef = doc(db, 'financialTransactions', txDoc.id);

        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', userId);
          const userSnap = await transaction.get(userRef as any);
          if (!userSnap.exists()) throw new Error('User not found');
          const userData = userSnap.data() as any;
          const newBal = (userData.balance || 0) + amount;
          newBalanceInKobo = newBal;
          transaction.update(userRef, { balance: newBal });
          transaction.update(txRef, { status: 'completed', completedAt: serverTimestamp(), balanceAfter: newBal });
        });
      }
    }

    return NextResponse.json({ success: res.ok, data: res.data, details, newBalanceInKobo }, { status: res.status || 200 });
  } catch (err) {
    logger.error('validate-otp error', err);
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
