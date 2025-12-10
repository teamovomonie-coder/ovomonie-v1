
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';



const CARD_FEE_KOBO = 1500_00; // ₦1,500

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that the card order request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('card order request received', { authPresent: Boolean(authHeader), path: '/api/cards/order' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in card order');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }


        const { nameOnCard, designType, designValue, shippingInfo, clientReference } = await request.json();

        if (!nameOnCard || !designType || !designValue || !shippingInfo || !clientReference) {
            return NextResponse.json({ message: 'Missing required order fields.' }, { status: 400 });
        }
        
        let newBalance = 0;

        await runTransaction(db, async (transaction) => {
            const cardOrdersRef = collection(db, 'cardOrders');
            const idempotencyQuery = query(cardOrdersRef, where("clientReference", "==", clientReference));
            const existingOrderSnapshot = await (transaction.get as any)(idempotencyQuery as any);

            if (!(existingOrderSnapshot as any).empty) {
                logger.info(`Idempotent request for card order: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) newBalance = userDoc.data().balance;
                return;
            }
            
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found.");

            const userData = userDoc.data();
            if (userData.balance < CARD_FEE_KOBO) {
                throw new Error("Insufficient funds to order a custom card.");
            }
            
            newBalance = userData.balance - CARD_FEE_KOBO;
            transaction.update(userRef, { balance: newBalance });

            // Log the card order
            const newOrderRef = doc(cardOrdersRef);
            transaction.set(newOrderRef, {
                userId,
                nameOnCard,
                designType,
                designValue,
                shippingInfo,
                clientReference,
                status: 'Processing',
                createdAt: serverTimestamp(),
            });

            // Log the debit transaction
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const debitLog = {
                userId: userId,
                category: 'card',
                type: 'debit',
                amount: CARD_FEE_KOBO,
                reference: `CARD-ORDER-${newOrderRef.id}`,
                narration: `Custom ATM card order`,
                party: { name: 'Ovomonie Card Services' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        return NextResponse.json({
            message: 'Card order placed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        logger.error("Card Order Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
