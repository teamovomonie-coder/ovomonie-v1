
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, deleteField } from "firebase/firestore";
import { createAuthToken, hashSecret, verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { User as FirestoreUser } from '@/types/user';


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
        const userData = userDoc.data() as Partial<FirestoreUser> & { loginPinHash?: string; loginPin?: string };
        
        if (!userData) {
             return NextResponse.json({ message: 'Authentication data is incomplete for this user.' }, { status: 401 });
        }

        const providedPin = String(pin).trim();
        const loginPinHash = userData.loginPinHash as string | undefined;
        let isValid = false;

        if (loginPinHash) {
            isValid = verifySecret(providedPin, loginPinHash);
        } else if (typeof userData.loginPin !== 'undefined') {
            // Legacy plaintext support with migration to hashed storage
            isValid = String(userData.loginPin) === providedPin;
            if (isValid) {
                try {
                    await updateDoc(userDoc.ref, {
                        loginPinHash: hashSecret(providedPin),
                        loginPin: deleteField(),
                    });
                } catch (migrationError) {
                    logger.error('Failed to migrate login PIN to hashed storage:', migrationError);
                }
            }
        }

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

        let token: string;
        try {
            token = createAuthToken(userDoc.id);
        } catch (tokenError) {
            logger.error('Failed to generate auth token', tokenError);
            return NextResponse.json({ message: 'Authentication is temporarily unavailable. Please try again later.' }, { status: 500 });
        }

        return NextResponse.json({
            token,
            userId: userDoc.id,
            fullName: userData.fullName,
            accountNumber: userData.accountNumber,
            balance: userData.balance ?? 0,
        });

    } catch (error) {
        logger.error("Login Error:", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error && error.message.includes('The query requires an index')) {
            errorMessage = "The database is missing a required index for login. Please check the server logs for a link to create it in the Firebase Console.";
        } else if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
