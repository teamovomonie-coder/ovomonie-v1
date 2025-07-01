import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { lineItems, referenceId } = body as { lineItems: { productId: string, quantity: number }[], referenceId: string };

        if (!lineItems || !referenceId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        for (const item of lineItems) {
            const product = await db.products.findById(item.productId);
            if (product) {
                // For simplicity, we deduct from the first location that has enough stock.
                // A real-world app would need more complex logic (e.g., which location is the sale from?).
                const firstLocationWithStock = product.stockByLocation.find(s => s.quantity >= item.quantity);
                if (firstLocationWithStock) {
                    const stockIndex = product.stockByLocation.findIndex(s => s.locationId === firstLocationWithStock.locationId);
                    
                    const previousStock = product.stockByLocation[stockIndex].quantity;
                    const newStock = previousStock - item.quantity;
                    
                    product.stockByLocation[stockIndex].quantity = newStock;
                    await db.products.update(product.id, { stockByLocation: product.stockByLocation });

                    await db.inventoryTransactions.create({
                        productId: product.id,
                        locationId: firstLocationWithStock.locationId,
                        type: 'sale',
                        quantity: -item.quantity, // Negative because it's a deduction
                        previousStock,
                        newStock,
                        referenceId: `Invoice ${referenceId}`,
                    });
                } else {
                    // What to do if no location has enough stock?
                    // For now, we'll just skip and maybe log an error. A real app would prevent the sale.
                    console.warn(`Insufficient stock for product ${product.name} (ID: ${product.id}) to fulfill sale for invoice ${referenceId}`);
                }
            }
        }

        return NextResponse.json({ message: 'Sales logged and stock updated' }, { status: 200 });
    } catch (error) {
        console.error('Sale logging error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
