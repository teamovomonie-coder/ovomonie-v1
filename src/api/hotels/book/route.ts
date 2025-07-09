
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

export async function POST(request: Request) {
    try {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid.' }, { status: 401 });
        }
        
        const token = authorization.split(' ')[1];
        if (!token.startsWith('fake-token-')) {
             return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
        }

        const userId = token.split('-')[2];
        if (!userId) {
            return NextResponse.json({ message: 'User ID not found in token.' }, { status: 401 });
        }
        
        const { hotel, room, dates, guests, guestInfo, totalAmount, clientReference } = await request.json();

        if (!hotel || !room || !dates || !guests || !guestInfo || !totalAmount || !clientReference) {
            return NextResponse.json({ message: 'Missing required booking fields.' }, { status: 400 });
        }

        const totalCostKobo = Math.round(totalAmount * 100);
        let newBalance = 0;
        const bookingRef = doc(collection(db, "hotelBookings"));

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for hotel booking: ${clientReference} already processed.`);
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
        console.error("Hotel Booking Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
