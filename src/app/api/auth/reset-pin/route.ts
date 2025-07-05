
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const { phone, newPin } = await request.json();

        if (!phone || !newPin) {
            return NextResponse.json({ message: 'Phone number and new PIN are required.' }, { status: 400 });
        }

        if (String(newPin).length !== 6) {
             return NextResponse.json({ message: 'New PIN must be 6 digits.' }, { status: 400 });
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ message: 'No account found with this phone number.' }, { status: 404 });
        }

        // Assuming phone numbers are unique
        const userDoc = querySnapshot.docs[0];
        
        await updateDoc(userDoc.ref, {
            loginPin: String(newPin)
        });

        return NextResponse.json({ message: 'Your PIN has been reset successfully.' });

    } catch (error) {
        console.error("PIN Reset Error:", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
