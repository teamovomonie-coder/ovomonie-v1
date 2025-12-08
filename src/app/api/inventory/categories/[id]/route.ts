import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { logger } from '@/lib/logger';


export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await _request.json();
        const { id } = await params;
        const docRef = doc(db, "categories", id);

        const { id: _bodyId, ...updateData } = body;
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        
        return NextResponse.json({ id, ...body });
    } catch (error) {
        logger.error("Error updating category: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const docRef = doc(db, "categories", id);
        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Category deleted' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting category: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
