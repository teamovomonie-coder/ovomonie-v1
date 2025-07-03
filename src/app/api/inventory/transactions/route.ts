import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

export async function GET() {
    try {
        // Fetch all collections in parallel
        const [transactionsSnapshot, productsSnapshot, locationsSnapshot] = await Promise.all([
            getDocs(query(collection(db, "inventoryTransactions"), orderBy("date", "desc"))),
            getDocs(collection(db, "products")),
            getDocs(collection(db, "locations"))
        ]);

        // Create maps for quick lookups
        const productsMap = new Map(productsSnapshot.docs.map(doc => [doc.id, doc.data()]));
        const locationsMap = new Map(locationsSnapshot.docs.map(doc => [doc.id, doc.data()]));

        const enrichedTransactions = transactionsSnapshot.docs.map(doc => {
            const txn = doc.data();
            const product = productsMap.get(txn.productId);
            const location = txn.locationId ? locationsMap.get(txn.locationId) : null;
            
            // Convert Firestore Timestamp to JSON-serializable string
            const date = (txn.date as Timestamp).toDate().toISOString();

            return {
                id: doc.id,
                ...txn,
                date,
                productName: product?.name || 'Unknown Product',
                locationName: location?.name || 'N/A',
            };
        });

        return NextResponse.json(enrichedTransactions);
    } catch (error) {
        console.error("Error fetching transactions: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
