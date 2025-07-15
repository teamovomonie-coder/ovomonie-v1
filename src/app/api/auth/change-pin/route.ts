
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';


export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { currentPin, newPin } = await request.json();

        if (!currentPin || !newPin) {
            return NextResponse.json({ message: 'Current and new PINs are required.' }, { status: 400 });
        }
        
        if (String(newPin).length !== 4) {
            return NextResponse.json({ message: 'New PIN must be 4 digits.' }, { status: 400 });
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        const userData = userDoc.data();
        
        // In a real app, PINs would be hashed. We are comparing plaintext for this demo.
        if (String(userData.transactionPin) !== String(currentPin)) {
            return NextResponse.json({ message: 'Incorrect current PIN.' }, { status: 401 });
        }

        if (String(currentPin) === String(newPin)) {
            return NextResponse.json({ message: 'New PIN cannot be the same as the old PIN.' }, { status: 400 });
        }

        await updateDoc(userRef, {
            transactionPin: String(newPin)
        });

        return NextResponse.json({ message: 'Transaction PIN changed successfully.' });

    } catch (error) {
        console.error("Change PIN Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
