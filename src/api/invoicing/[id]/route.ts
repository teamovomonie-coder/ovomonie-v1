
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { headers } from 'next/headers';


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const docRef = doc(db, 'invoices', params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 });
        }
        
        const { id, ...updateData } = body;
        
        // Ensure dates are converted to Firestore Timestamps if they are strings
        if (updateData.issueDate) {
            updateData.issueDate = new Date(updateData.issueDate);
        }
        if (updateData.dueDate) {
            updateData.dueDate = new Date(updateData.dueDate);
        }

        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        
        const updatedDoc = await getDoc(docRef);
        const responseData = updatedDoc.data();
        // Convert timestamps to ISO strings for the response
        if (responseData) {
            responseData.issueDate = (responseData.issueDate as Timestamp).toDate().toISOString();
            responseData.dueDate = (responseData.dueDate as Timestamp).toDate().toISOString();
        }

        return NextResponse.json({ id: updatedDoc.id, ...responseData });
    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const docRef = doc(db, 'invoices', params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Invoice not found or access denied' }, { status: 404 });
        }

        await deleteDoc(docRef);
        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
