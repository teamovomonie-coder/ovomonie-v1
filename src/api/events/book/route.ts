
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, query, where } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';





export async function POST(request: Request) {
    const userId = getUserIdFromToken(headers());
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { eventId, tickets, totalAmount, clientReference } = await request.json();
        
        if (!eventId || !tickets || !totalAmount || !clientReference) {
            return NextResponse.json({ message: 'Missing required booking fields.' }, { status: 400 });
        }

        const totalCostKobo = Math.round(totalAmount * 100);
        let newBalance = 0;
        const bookingRef = doc(collection(db, 'eventBookings'));

        await runTransaction(db, async (transaction) => {
            const idempotencyQuery = query(collection(db, 'financialTransactions'), where("reference", "==", clientReference));
            const existingTxn = await transaction.get(idempotencyQuery);
            if (!existingTxn.empty) {
                throw new Error("Duplicate request. This booking has already been processed.");
            }

            const userRef = doc(db, 'users', userId);
            const eventRef = doc(db, 'events', eventId);

            const [userDoc, eventDoc] = await Promise.all([
                transaction.get(userRef),
                transaction.get(eventRef)
            ]);
            
            if (!userDoc.exists()) throw new Error("User not found.");
            if (!eventDoc.exists()) throw new Error("Event not found.");
            
            const userData = userDoc.data();
            if (userData.balance < totalCostKobo) {
                throw new Error("Insufficient funds for this booking.");
            }

            newBalance = userData.balance - totalCostKobo;
            transaction.update(userRef, { balance: newBalance });

            transaction.set(bookingRef, {
                userId,
                eventId,
                eventName: eventDoc.data().name,
                tickets,
                totalCostKobo,
                clientReference,
                bookingReference: `OVO-EVT-${bookingRef.id.slice(0, 6).toUpperCase()}`,
                createdAt: serverTimestamp(),
            });

            const debitLog = {
                userId,
                category: 'entertainment',
                type: 'debit',
                amount: totalCostKobo,
                reference: clientReference,
                narration: `Ticket purchase for ${eventDoc.data().name}`,
                party: { name: 'Ovomonie Events' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(collection(db, 'financialTransactions')), debitLog);
        });

        return NextResponse.json({
            message: 'Booking successful!',
            newBalanceInKobo: newBalance,
            bookingReference: `OVO-EVT-${bookingRef.id.slice(0, 6).toUpperCase()}`,
        }, { status: 200 });

    } catch (error) {
        logger.error("Event Booking Error:", error);
        return NextResponse.json({ message: (error as Error).message }, { status: 400 });
    }
}
