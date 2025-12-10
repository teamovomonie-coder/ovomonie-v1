import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { subject, category, description } = body;

        if (!subject || !category || !description) {
            return NextResponse.json({ message: 'Missing required fields for support ticket.' }, { status: 400 });
        }

        const newTicket = {
            userId,
            subject,
            category,
            description,
            status: 'Open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "supportTickets"), newTicket);

        // TODO: In a real app, you would also trigger a notification to the support team.
        return NextResponse.json({ message: 'Support ticket created successfully!', ticketId: docRef.id }, { status: 201 });

    } catch (error) {
        logger.error("Error creating support ticket:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const q = query(
            collection(db, "supportTickets"), 
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const tickets = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
                updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
            };
        });

        return NextResponse.json(tickets);
    } catch (error) {
        logger.error("Error fetching support tickets: ", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error && error.message.includes('The query requires an index')) {
            errorMessage = "The database is missing a required index. Please check the server logs for a link to create it in the Firebase Console.";
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
