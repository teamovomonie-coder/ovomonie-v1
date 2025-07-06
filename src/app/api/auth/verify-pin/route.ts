
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";

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
        if (String(userData.transactionPin) === String(pin)) {
            return NextResponse.json({ success: true, message: 'PIN verified.' });
        } else {
            return NextResponse.json({ success: false, message: 'The PIN you entered is incorrect.' }, { status: 401 });
        }

    } catch (error) {
        console.error("PIN Verification Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
