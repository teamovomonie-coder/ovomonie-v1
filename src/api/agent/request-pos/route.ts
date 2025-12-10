
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';



export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }


        const body = await request.json();
        const { businessName, address, contactInfo, posType, clientReference } = body;

        if (!businessName || !address || !contactInfo || !posType) {
            return NextResponse.json({ message: 'Missing required fields for POS request.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference is required for this request.' }, { status: 400 });
        }

        const posRequestsRef = collection(db, "posRequests");

        // Idempotency Check
        const idempotencyQuery = query(posRequestsRef, where("clientReference", "==", clientReference));
        const existingRequest = await getDocs(idempotencyQuery);
        if (!existingRequest.empty) {
            return NextResponse.json({ message: 'This request has already been submitted.' }, { status: 200 });
        }

        await addDoc(posRequestsRef, {
            agentId: userId,
            ...body,
            status: 'Pending',
            createdAt: serverTimestamp(),
        });
        
        return NextResponse.json({ message: 'POS request submitted successfully!' }, { status: 201 });

    } catch (error) {
        logger.error("POS Request Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
