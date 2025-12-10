
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


        // In a real application, you would query a 'terminals' collection like this:
        // const q = query(collection(db, "terminals"), where("agentId", "==", userId));
        // const querySnapshot = await getDocs(q);
        // const terminals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // For this implementation, we return mock data based on a user being registered as an agent.
        const mockTerminals = [
            { id: 'POS-001', serialNumber: 'SN-A987B1', status: 'Active', location: 'Lekki Phase 1', assignedTo: 'John Doe', lastActivity: '2 minutes ago', settlementAccount: '0123456789 - GTB' },
            { id: 'POS-003', serialNumber: 'SN-E678F3', status: 'Active', location: 'Lekki Phase 1', assignedTo: 'Femi Adebola', lastActivity: 'now', settlementAccount: '1122334455 - UBA' },
        ];
        
        return NextResponse.json(mockTerminals, { status: 200 });

    } catch (error) {
        logger.error("Agent Terminals Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
