
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const { phone, pin } = await request.json();

        if (!phone || !pin) {
            return NextResponse.json({ message: 'Phone number and PIN are required.' }, { status: 400 });
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // In a real production app, the PIN should be hashed and compared using a library like bcrypt.
        // Storing PINs in plaintext is not secure.
        // Added String() to make the comparison more robust against type mismatches.
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
