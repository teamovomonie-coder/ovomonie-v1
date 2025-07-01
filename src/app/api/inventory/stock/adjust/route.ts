import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, locationId, newStock, reason, notes } = body;

        if (!productId || !locationId || newStock === undefined || !reason) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const product = await db.products.findById(productId);
        if (!product) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        const stockIndex = product.stockByLocation.findIndex(s => s.locationId === locationId);
        if (stockIndex === -1) {
            return NextResponse.json({ message: 'Location not found for this product' }, { status: 404 });
        }

        const previousStock = product.stockByLocation[stockIndex].quantity;
        const quantityChanged = newStock - previousStock;

        // Update product stock
        product.stockByLocation[stockIndex].quantity = newStock;
        await db.products.update(productId, { stockByLocation: product.stockByLocation });
        
        // Create transaction log
        await db.inventoryTransactions.create({
            productId,
            locationId,
            type: 'adjustment',
            quantity: quantityChanged,
            previousStock,
            newStock,
            notes: `${reason}${notes ? `: ${notes}` : ''}`,
        });

        return NextResponse.json({ message: 'Stock adjusted and logged successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
