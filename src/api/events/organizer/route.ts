
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';





export async function GET(request: Request) {
    const userId = getUserIdFromToken(headers());
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const q = query(collection(db, "events"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
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
        logger.error("Error fetching hosted events: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
