import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function GET() {
    try {
        const transactions = await db.inventoryTransactions.findMany();
        const products = await db.products.findMany();
        const locations = await db.locations.findMany();

        const enrichedTransactions = transactions.map(txn => {
            const product = products.find(p => p.id === txn.productId);
            const location = txn.locationId ? locations.find(l => l.id === txn.locationId) : null;
            return {
                ...txn,
                productName: product?.name || 'Unknown Product',
                locationName: location?.name || 'N/A',
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent first

        return NextResponse.json(enrichedTransactions);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
