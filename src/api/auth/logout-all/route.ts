
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userRef = doc(db, 'users', userId);

        // Update a timestamp on the user's document.
        // All active tokens issued before this timestamp will be considered invalid.
        await updateDoc(userRef, {
            lastLogoutAll: serverTimestamp()
        });

        return NextResponse.json({ message: 'Successfully logged out all other devices.' });

    } catch (error) {
        logger.error("Logout All Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
