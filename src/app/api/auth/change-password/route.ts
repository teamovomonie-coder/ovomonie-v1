
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { hashSecret, verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(await headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Current and new passwords are required.' }, { status: 400 });
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        const userData = userDoc.data();
        
        const loginPinHash = userData.loginPinHash as string | undefined;
        const currentMatches = loginPinHash
            ? verifySecret(String(currentPassword), loginPinHash)
            : String(userData.loginPin) === String(currentPassword);

        if (!currentMatches) {
            return NextResponse.json({ message: 'Incorrect current password.' }, { status: 401 });
        }
        
        if (String(currentPassword) === String(newPassword)) {
            return NextResponse.json({ message: 'New password cannot be the same as the old password.' }, { status: 400 });
        }
        
        await updateDoc(userRef, {
            loginPinHash: hashSecret(String(newPassword)),
            loginPin: deleteField(),
        });

        return NextResponse.json({ message: 'Password changed successfully.' });

    } catch (error) {
        logger.error("Change Password Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
