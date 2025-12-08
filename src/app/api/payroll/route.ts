
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';





export async function GET() {
    try {
        const userId = getUserIdFromToken(await headers());
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
        const userId = getUserIdFromToken(await headers());
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
