
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { headers } from 'next/headers';

async function getUserIdFromToken() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.split(' ')[1];
    if (!token.startsWith('fake-token-')) {
        return null;
    }
    return token.split('-')[2] || null;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const docRef = doc(db, 'payrollBatches', params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        const data = { ...docSnap.data(), id: docSnap.id };
        if (data.paymentDate) {
            data.paymentDate = data.paymentDate.toDate();
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const docRef = doc(db, 'payrollBatches', params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().userId !== userId) {
            return NextResponse.json({ message: 'Payroll batch not found or access denied' }, { status: 404 });
        }

        const { id, ...updateData } = body;
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
        });

        const updatedDoc = await getDoc(docRef);
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error("Error updating payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const docRef = doc(db, 'payrollBatches', params.id);
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
        console.error("Error deleting payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
