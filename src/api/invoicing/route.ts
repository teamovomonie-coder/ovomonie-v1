
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function GET(request: Request) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const q = query(collection(db, 'invoices'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // This robust conversion prevents crashes if any date field is missing or null.
            return {
                id: doc.id,
                ...data,
                issueDate: data.issueDate ? (data.issueDate as Timestamp).toDate().toISOString() : new Date().toISOString(),
                dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate().toISOString() : new Date().toISOString(),
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
            };
        });
        return NextResponse.json(invoices);
    } catch (error) {
        logger.error("Error fetching invoices:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { clientReference, ...invoiceData } = body;

        if (!invoiceData.invoiceNumber || !invoiceData.toName) {
            return NextResponse.json({ message: 'Missing required invoice fields.' }, { status: 400 });
        }
        
        // Ensure dates are always valid Date objects before storing.
        const issueDate = invoiceData.issueDate ? new Date(invoiceData.issueDate) : new Date();
        const dueDate = invoiceData.dueDate ? new Date(invoiceData.dueDate) : new Date();

        const newInvoice = {
            ...invoiceData,
            userId,
            clientReference: clientReference || null,
            issueDate: issueDate,
            dueDate: dueDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
             return NextResponse.json({ message: 'Failed to create invoice after transaction.' }, { status: 500 });
        }
        
        const createdInvoiceData = docSnap.data();

        // Safely convert timestamps back to ISO strings for the response.
        const createdInvoice = {
            id: docSnap.id,
            ...createdInvoiceData,
            issueDate: createdInvoiceData.issueDate ? (createdInvoiceData.issueDate as Timestamp).toDate().toISOString() : new Date().toISOString(),
            dueDate: createdInvoiceData.dueDate ? (createdInvoiceData.dueDate as Timestamp).toDate().toISOString() : new Date().toISOString(),
            createdAt: createdInvoiceData.createdAt ? (createdInvoiceData.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
            updatedAt: createdInvoiceData.updatedAt ? (createdInvoiceData.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        };

        return NextResponse.json(createdInvoice, { status: 201 });
    } catch (error) {
        logger.error("Error creating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
