
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';



export async function GET(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }


        const holdingsQuery = query(collection(db, "stockHoldings"), where("userId", "==", userId));
        const querySnapshot = await getDocs(holdingsQuery);
        
        const holdings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(holdings);

    } catch (error) {
        logger.error("Portfolio API Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
