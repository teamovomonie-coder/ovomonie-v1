import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const docRef = doc(db, "locations", params.id);

        const { id, ...updateData } = body;
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        
        return NextResponse.json({ id: params.id, ...body });
    } catch (error) {
        console.error("Error updating location: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const docRef = doc(db, "locations", params.id);
        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Location deleted' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting location: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
