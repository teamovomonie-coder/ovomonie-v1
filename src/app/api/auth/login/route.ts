
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const { phone, pin } = await request.json();

        if (!phone || !pin) {
            return NextResponse.json({ message: 'Phone number and PIN are required.' }, { status: 400 });
        }

        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        // Defensively find the user document, protecting against malformed docs without a `phone` field.
        const userDoc = usersSnapshot.docs.find(doc => doc.data()?.phone === phone);

        if (!userDoc) {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

        const userData = userDoc.data();

        // Protect against documents that might be missing the loginPin field.
        if (!userData || typeof userData.loginPin === 'undefined') {
             return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }
        
        if (String(userData.loginPin) === String(pin)) {
            // This is a mock token. In production, use JWTs (JSON Web Tokens).
            const token = `fake-token-${userDoc.id}-${Date.now()}`;
            return NextResponse.json({ token, userId: userDoc.id, fullName: userData.fullName });
        } else {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

    } catch (error) {
        console.error("Login Error:", error);
        // Provide a more specific error message if possible
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
    }
}
