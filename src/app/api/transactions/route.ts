import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/logger';


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
        logger.error("Error fetching financial transactions: ", error);
        let errorMessage = 'An internal server error occurred.';
         if (error instanceof Error && error.message.includes('The query requires an index')) {
            errorMessage = "The database is missing a required index for fetching financial transactions. Please check the server logs for a link to create it in the Firebase Console.";
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
