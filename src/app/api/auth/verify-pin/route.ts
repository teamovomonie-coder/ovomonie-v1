
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(await headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { pin } = await request.json();

        if (!pin || String(pin).length !== 4) {
            return NextResponse.json({ message: 'A valid 4-digit transaction PIN is required.' }, { status: 400 });
        }

        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        const userData = userDoc.data();
        const transactionPinHash = userData.transactionPinHash as string | undefined;
        const matches = transactionPinHash
            ? verifySecret(String(pin), transactionPinHash)
            : String(userData.transactionPin) === String(pin);

        if (matches) {
            return NextResponse.json({ success: true, message: 'PIN verified.' });
        } else {
            return NextResponse.json({ success: false, message: 'The PIN you entered is incorrect.' }, { status: 401 });
        }

    } catch (error) {
        logger.error("PIN Verification Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
