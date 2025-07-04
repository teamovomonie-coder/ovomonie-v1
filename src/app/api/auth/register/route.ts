
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, phone, loginPin, fullName } = body;

        if (!email || !phone || !loginPin || !fullName) {
            return NextResponse.json({ message: 'Missing required fields for registration.' }, { status: 400 });
        }

        // Check if user already exists with the same email or phone
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", email));
        const phoneQuery = query(usersRef, where("phone", "==", phone));

        const [emailSnapshot, phoneSnapshot] = await Promise.all([
            getDocs(emailQuery),
            getDocs(phoneQuery)
        ]);

        if (!emailSnapshot.empty) {
            return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
        }
        if (!phoneSnapshot.empty) {
            return NextResponse.json({ message: 'An account with this phone number already exists.' }, { status: 409 });
        }

        // Generate account number from the last 10 digits of the phone number
        const accountNumber = phone.slice(-10);

        // Create new user document
        const newUser = {
            ...body,
            accountNumber,
            // In a real app, the PIN should be securely hashed before saving.
            // For simplicity, we are storing it in plaintext. THIS IS NOT SECURE FOR PRODUCTION.
            balance: 125034500, // Initial balance in kobo (e.g., ₦1,250,345.00)
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(usersRef, newUser);
        
        return NextResponse.json({ message: 'Registration successful!', userId: docRef.id }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        let errorMessage = 'An internal server error occurred.';
        // Check if the error message is about a missing Firestore index
        if (error instanceof Error && error.message.includes('The query requires an index')) {
            errorMessage = "The database is missing a required index for user registration. Please check the server logs for a link to create it in the Firebase Console.";
        } else if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
