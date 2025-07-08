
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
        
        const body = await request.json();
        const { businessName, businessAddress, posSerialNumber } = body;

        if (!businessName || !businessAddress || !posSerialNumber) {
            return NextResponse.json({ message: 'Missing required registration fields.' }, { status: 400 });
        }

        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
            isAgent: true,
            businessName: businessName,
            businessAddress: businessAddress,
            // In a real app, you would also create an initial POS terminal entry.
        });
        
        // You might want to also create a POS terminal entry here.

        return NextResponse.json({ message: 'Agent registration successful!' }, { status: 200 });

    } catch (error) {
        console.error("Agent Registration Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
