
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, runTransaction, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';



const LISTING_FEE_KOBO = 20000_00; // ₦20,000



export async function GET(request: Request) {
    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const events = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate().toISOString(),
            };
        });
        return NextResponse.json(events);
    } catch (error) {
        logger.error("Error fetching events: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { clientReference, ...eventData } = body;

        // Check for duplicate request before transaction
        const idempotencyQuery = query(collection(db, 'financialTransactions'), where("reference", "==", clientReference));
        const existingTxn = await getDocs(idempotencyQuery);
        if (!existingTxn.empty) {
            return NextResponse.json({ message: 'Duplicate request. This event has already been processed.' }, { status: 409 });
        }
        
        let newBalance = 0;
        const newEventRef = doc(collection(db, "events"));

        await runTransaction(db, async (transaction) => {

            const userRef = doc(db, 'users', userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found.");

            const userData = userDoc.data();
            if (userData.balance < LISTING_FEE_KOBO) {
                throw new Error("Insufficient funds for the listing fee.");
            }

            newBalance = userData.balance - LISTING_FEE_KOBO;
            transaction.update(userRef, { balance: newBalance });

            transaction.set(newEventRef, {
                ...eventData,
                userId,
                date: new Date(eventData.date), // Convert date string back to Date object for Firestore
                createdAt: serverTimestamp(),
            });

            const feeLog = {
                userId,
                category: 'fees',
                type: 'debit',
                amount: LISTING_FEE_KOBO,
                reference: clientReference,
                narration: `Event listing fee for "${eventData.name}"`,
                party: { name: 'Ovomonie Events' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(collection(db, 'financialTransactions')), feeLog);
        });

        const createdEventSnap = await getDoc(newEventRef);
        const createdEvent = {
            id: createdEventSnap.id,
            ...createdEventSnap.data(),
            date: (createdEventSnap.data()?.date as Timestamp).toDate().toISOString(),
        }

        return NextResponse.json({
            message: 'Event listed successfully!',
            newBalanceInKobo: newBalance,
            event: createdEvent,
        }, { status: 201 });

    } catch (error) {
        logger.error("Error creating event:", error);
        return NextResponse.json({ message: (error as Error).message }, { status: 400 });
    }
}
