import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { logger } from '@/lib/logger';


export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        logger.error("Error fetching product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await _request.json();
        const { id } = await params;
        const docRef = doc(db, "products", id);
        
        // Ensure we don't try to update the ID field
        const { id: _bodyId, ...updateData } = body;

        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
        });
        return NextResponse.json({ id, ...body });
    } catch (error) {
        logger.error("Error updating product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const docRef = doc(db, "products", id);
        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
    } catch (error) {
        logger.error("Error deleting product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
