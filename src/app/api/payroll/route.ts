
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';





export async function GET(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that payroll GET request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('payroll GET request received', { authPresent: Boolean(authHeader), path: '/api/payroll' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in payroll GET');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const q = query(collection(db, 'payrollBatches'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const batches = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            paymentDate: doc.data().paymentDate?.toDate(),
        }));
        return NextResponse.json(batches);
    } catch (error) {
        logger.error("Error fetching payroll batches:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that payroll POST request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('payroll POST request received', { authPresent: Boolean(authHeader), path: '/api/payroll' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in payroll POST');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...batchData } = body; // Exclude client-generated draft ID

        const newBatch = {
            ...batchData,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'payrollBatches'), newBatch);
        const savedBatch = { id: docRef.id, ...newBatch };
        
        return NextResponse.json(savedBatch, { status: 201 });
    } catch (error) {
        logger.error("Error creating payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
