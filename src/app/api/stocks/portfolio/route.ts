
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: Request) {
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

        const holdingsQuery = query(collection(db, "stockHoldings"), where("userId", "==", userId));
        const querySnapshot = await getDocs(holdingsQuery);
        
        const holdings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(holdings);

    } catch (error) {
        console.error("Portfolio API Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
