
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
        console.error("Agent Terminals Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
