import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

export async function GET() {
    try {
        const q = query(collection(db, "financialTransactions"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const transactions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to JSON-serializable string
            const timestamp = (data.timestamp as Timestamp).toDate().toISOString();
            return {
                id: doc.id,
                ...data,
                timestamp,
            };
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Error fetching financial transactions: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
