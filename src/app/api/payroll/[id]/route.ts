
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';





export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const docRef = doc(db, 'payrollBatches', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        const data = { ...docSnap.data(), id: docSnap.id } as any;
        if (data.paymentDate) {
            data.paymentDate = data.paymentDate.toDate();
        }

        return NextResponse.json(data);
    } catch (error) {
        logger.error("Error fetching payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id } = await params;
        const docRef = doc(db, 'payrollBatches', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        const { id: _bodyId, ...updateData } = body;
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
        });

        const updatedDoc = await getDoc(docRef);
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        logger.error("Error updating payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const docRef = doc(db, 'payrollBatches', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }
        
        // You might want to restrict deletion to only 'Draft' batches
        if (docSnap.data().status !== 'Draft') {
            return NextResponse.json({ message: 'Cannot delete a processed payroll batch.' }, { status: 403 });
        }

        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Payroll batch deleted successfully' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
