
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/logger';


export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const docRef = doc(db, "events", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }
        
        const data = docSnap.data();
        const event = {
            id: docSnap.id,
            ...data,
            date: (data.date as Timestamp).toDate().toISOString(),
        };

        return NextResponse.json(event);

    } catch (error) {
        logger.error("Error fetching event: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
