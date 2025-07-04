
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const { phone, pin } = await request.json();

        if (!phone || !pin) {
            return NextResponse.json({ message: 'Phone number and PIN are required.' }, { status: 400 });
        }

        // Inefficiently get all users to avoid needing a Firestore index during development.
        // This should be reverted to a query with a 'where' clause in production.
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const userDoc = usersSnapshot.docs.find(doc => doc.data().phone === phone);

        if (!userDoc) {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

        const userData = userDoc.data();

        // In a real production app, the PIN should be hashed and compared using a library like bcrypt.
        // Storing PINs in plaintext is not secure.
        if (String(userData.loginPin) === String(pin)) {
            // This is a mock token. In production, use JWTs (JSON Web Tokens).
            const token = `fake-token-${userDoc.id}-${Date.now()}`;
            return NextResponse.json({ token, userId: userDoc.id, fullName: userData.fullName });
        } else {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
