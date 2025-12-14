
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
    getDocs,
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

        
        const { hotel, room, dates, guests, guestInfo, totalAmount, clientReference } = await request.json();

        if (!hotel || !room || !dates || !guests || !guestInfo || !totalAmount || !clientReference) {
            return NextResponse.json({ message: 'Missing required booking fields.' }, { status: 400 });
        }

        const totalCostKobo = Math.round(totalAmount * 100);
        let newBalance = 0;
        const bookingRef = doc(collection(db, "hotelBookings"));

        // Check for duplicate request before transaction
        const financialTransactionsRef = collection(db, 'financialTransactions');
        const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
        const existingTxnSnapshot = await getDocs(idempotencyQuery);
        if (!existingTxnSnapshot.empty) {
            logger.info(`Idempotent request for hotel booking: ${clientReference} already processed.`);
            return NextResponse.json({ message: 'Booking already processed.' }, { status: 200 });
        }

        await runTransaction(db, async (transaction) => {

            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found.");

            const userData = userDoc.data();
            if (userData.balance < totalCostKobo) {
                throw new Error("Insufficient funds for this booking.");
            }

            newBalance = userData.balance - totalCostKobo;
            transaction.update(userRef, { balance: newBalance });
            
            // Log the hotel booking
            transaction.set(bookingRef, {
                userId,
                hotel,
                room,
                dates,
                guests,
                guestInfo,
                totalCostKobo,
                clientReference,
                bookingReference: `OVO-HOTEL-${bookingRef.id.slice(0, 6).toUpperCase()}`,
                createdAt: serverTimestamp(),
            });

            // Log the financial transaction
            const debitLog = {
                userId,
                category: 'travel',
                type: 'debit',
                amount: totalCostKobo,
                reference: clientReference,
                narration: `Hotel booking at ${hotel.name}`,
                party: { name: hotel.name },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        return NextResponse.json({
            message: 'Booking successful!',
            newBalanceInKobo: newBalance,
            bookingReference: `OVO-HOTEL-${bookingRef.id.slice(0, 6).toUpperCase()}`
        }, { status: 200 });

    } catch (error) {
        logger.error("Hotel Booking Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
