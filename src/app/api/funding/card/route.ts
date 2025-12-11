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
import { initiateCardPayment } from '@/lib/vfd';

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { amount, clientReference, cardNumber, cardPin, cvv, expiry } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        // Idempotency
        const financialTransactionsRef = collection(db, 'financialTransactions');
        const idempotencyQuery = query(financialTransactionsRef, where('reference', '==', clientReference));
        const existing = await getDocs(idempotencyQuery as any).catch(() => null);
        if (existing && !(existing as any).empty) {
            const userRef = doc(db, 'users', userId);
            const userSnapshot = await getDoc(userRef as any);
            const currentBal = userSnapshot.exists() ? (userSnapshot.data() as any)?.balance : null;
            return NextResponse.json({ message: 'Already processed', newBalanceInKobo: currentBal }, { status: 200 });
        }

        const amountInKobo = Math.round(amount * 100);
        const pending = {
            userId,
            category: 'deposit',
            type: 'credit',
            amount: amountInKobo,
            reference: clientReference,
            narration: 'Card deposit (pending)',
            party: { name: 'VFD Card' },
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        const pendingRef = await addDoc(financialTransactionsRef, pending as any);

        if (!cardNumber || !cardPin || !cvv || !expiry) {
            return NextResponse.json({ message: 'Card details (number, pin, cvv, expiry) are required for card funding.' }, { status: 400 });
        }

        const [mm, yy] = expiry.split('/');
        const expiryYyMm = `${yy}${mm}`;

        const initiation = await initiateCardPayment({
            amount: Math.round(amount),
            reference: clientReference,
            cardNumber,
            cardPin,
            cvv2: cvv,
            expiryDate: expiryYyMm,
            shouldTokenize: false,
        });

        logger.debug('VFD initiation', { initiation });

        if (initiation.ok && initiation.data && initiation.data.data && initiation.data.data.serviceResponseCodes === 'COMPLETED') {
            // finalize
            let newBalance = 0;
            await runTransaction(db, async (tx) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await tx.get(userRef as any);
                if (!userDoc.exists()) throw new Error('User not found');
                const userData = userDoc.data();
                newBalance = (userData.balance || 0) + amountInKobo;
                tx.update(userRef, { balance: newBalance });
                await updateDoc(pendingRef, { status: 'completed', completedAt: serverTimestamp(), balanceAfter: newBalance });
            });

            return NextResponse.json({ message: 'Funding successful!', newBalanceInKobo: newBalance, vfd: initiation.data }, { status: 200 });
        }

        return NextResponse.json({ message: 'VFD initiation requires further action', vfd: initiation.data || initiation }, { status: initiation.status || 200 });
    } catch (err) {
        logger.error('funding/card error', err);
        return NextResponse.json({ message: err instanceof Error ? err.message : 'An internal server error occurred.' }, { status: 500 });
    }
}
