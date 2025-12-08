
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';



export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = getUserIdFromToken(await headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id } = await params;
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 });
        }
        
        const { id: _, ...updateData } = body;
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        
        const updatedDoc = await getDoc(docRef);
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        logger.error("Error updating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = getUserIdFromToken(await headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 });
        }

        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
