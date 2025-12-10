
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function GET(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that invoicing GET request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('invoicing GET request received', { authPresent: Boolean(authHeader), path: '/api/invoicing' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in invoicing GET');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const q = query(collection(db, 'invoices'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                issueDate: (data.issueDate as Timestamp).toDate(),
                dueDate: (data.dueDate as Timestamp).toDate(),
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
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that invoicing POST request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('invoicing POST request received', { authPresent: Boolean(authHeader), path: '/api/invoicing' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in invoicing POST');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { clientReference, ...invoiceData } = body;

        if (!invoiceData.invoiceNumber || !invoiceData.toName) {
            return NextResponse.json({ message: 'Missing required invoice fields.' }, { status: 400 });
        }

        const newInvoice = {
            ...invoiceData,
            userId,
            clientReference: clientReference || null,
            issueDate: new Date(invoiceData.issueDate),
            dueDate: new Date(invoiceData.dueDate),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
             return NextResponse.json({ message: 'Failed to create invoice after transaction.' }, { status: 500 });
        }
        
        const createdInvoiceData = docSnap.data();

        const createdInvoice = {
            id: docSnap.id,
            ...createdInvoiceData,
            issueDate: (createdInvoiceData.issueDate as Timestamp).toDate(),
            dueDate: (createdInvoiceData.dueDate as Timestamp).toDate(),
        };

        return NextResponse.json(createdInvoice, { status: 201 });
    } catch (error) {
        logger.error("Error creating invoice:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
