import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const docRef = doc(db, "products", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        console.error("Error fetching product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const docRef = doc(db, "products", params.id);
        
        // Ensure we don't try to update the ID field
        const { id, ...updateData } = body;

        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
        });
        return NextResponse.json({ id: params.id, ...body });
    } catch (error) {
        console.error("Error updating product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const docRef = doc(db, "products", params.id);
        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
