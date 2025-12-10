
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
    addDoc,
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

        
        const { ride, searchDetails, clientReference } = await request.json();

        if (!ride || !searchDetails || !clientReference) {
            return NextResponse.json({ message: 'Missing required booking fields.' }, { status: 400 });
        }

        const totalCostKobo = Math.round(ride.price * 100);
        let newBalance = 0;
        const bookingRef = doc(collection(db, "rideBookings"));

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                logger.info(`Idempotent request for ride booking: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) newBalance = userDoc.data().balance;
                return;
            }

            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found.");

            const userData = userDoc.data();
            if (userData.balance < totalCostKobo) {
                throw new Error("Insufficient funds for this ride.");
            }

            newBalance = userData.balance - totalCostKobo;
            transaction.update(userRef, { balance: newBalance });
            
            // Log the ride booking
            transaction.set(bookingRef, {
                userId,
                ride,
                searchDetails,
                totalCostKobo,
                clientReference,
                bookingReference: `OVO-RIDE-${bookingRef.id.slice(0, 6).toUpperCase()}`,
                createdAt: serverTimestamp(),
            });

            // Log the financial transaction
            const debitLog = {
                userId,
                category: 'transport',
                type: 'debit',
                amount: totalCostKobo,
                reference: clientReference,
                narration: `Ride from ${searchDetails.pickup} to ${searchDetails.destination}`,
                party: { name: `Ride with ${ride.name}` },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        return NextResponse.json({
            message: 'Ride payment successful!',
            newBalanceInKobo: newBalance,
            bookingReference: `OVO-RIDE-${bookingRef.id.slice(0, 6).toUpperCase()}`
        }, { status: 200 });

    } catch (error) {
        logger.error("Ride Booking Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
