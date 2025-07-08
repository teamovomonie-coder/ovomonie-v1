
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';
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

export async function GET() {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const q = query(collection(db, 'invoices'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            issueDate: doc.data().issueDate.toDate(),
            dueDate: doc.data().dueDate.toDate(),
        }));
        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { clientReference, ...invoiceData } = body;

        // Basic validation
        if (!invoiceData.invoiceNumber || !invoiceData.toName) {
            return NextResponse.json({ message: 'Missing required invoice fields.' }, { status: 400 });
        }

        const newInvoiceRef = doc(collection(db, 'invoices'));

        await runTransaction(db, async (transaction) => {
            if (clientReference) {
                const idempotencyQuery = query(collection(db, 'invoices'), where("clientReference", "==", clientReference), where("userId", "==", userId));
                const existingInvSnapshot = await transaction.get(idempotencyQuery);
                if (!existingInvSnapshot.empty) {
                    console.log(`Idempotent request for invoice: ${clientReference} already processed.`);
                    // To ensure the client gets the data, we can just return the existing invoice, though for this setup we just stop.
                    // This part can be enhanced to return the existing document's data.
                    return;
                }
            }
            
            transaction.set(newInvoiceRef, {
                ...invoiceData,
                userId,
                clientReference: clientReference || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });
        
        // Refetch the document to return it, since we can't get it from the transaction result directly
        const docSnap = await getDocs(query(collection(db, 'invoices'), where('__name__', '==', newInvoiceRef.id)));
        const createdInvoice = {
            id: docSnap.docs[0].id,
            ...docSnap.docs[0].data(),
        };

        return NextResponse.json(createdInvoice, { status: 201 });
    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
