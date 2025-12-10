
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';



export async function GET(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists() || !userDoc.data()?.isAgent) {
             return NextResponse.json({ message: 'User is not a registered agent.' }, { status: 403 });
        }
        
        // In a real-world app, this data would be fetched from a dedicated 'agentStats' collection
        // or calculated via a more complex query. For this implementation, we return realistic mock data.
        const mockAgentData = {
          points: 12500,
          cashEquivalent: 12500,
          progress: {
            amount: 150000,
            transactions: 15,
            targetAmount: 300000,
            targetTransactions: 20,
          },
          tier: 'Gold',
        };

        return NextResponse.json(mockAgentData, { status: 200 });

    } catch (error) {
        logger.error("Agent Hub Data Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
