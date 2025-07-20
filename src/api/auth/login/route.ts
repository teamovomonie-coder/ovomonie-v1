
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
        
        if (!userData || typeof userData.loginPin === 'undefined') {
             return NextResponse.json({ message: 'Authentication data is incomplete for this user.' }, { status: 401 });
        }
        
        // In a real app, PINs would be hashed. We are comparing plaintext for this demo.
        if (String(userData.loginPin) === String(pin).trim()) {
            const token = `fake-token-${userDoc.id}-${Date.now()}`;
            return NextResponse.json({ token, userId: userDoc.id });
        } else {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

    } catch (error) {
        console.error("Login Error:", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error && error.message.includes('The query requires an index')) {
            errorMessage = "The database is missing a required index for login. Please check the server logs for a link to create it in the Firebase Console.";
        } else if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
