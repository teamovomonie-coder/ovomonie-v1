import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, locationId, newStock, reason, notes } = body;

        if (!productId || !locationId || newStock === undefined || !reason) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const productRef = doc(db, "products", productId);
        let previousStock = 0;
        let quantityChanged = 0;

        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("Product not found");
            }

            const product = productDoc.data();
            const stockIndex = product.stockByLocation.findIndex((s: any) => s.locationId === locationId);
            if (stockIndex === -1) {
                throw new Error("Location not found for this product");
            }
            
            previousStock = product.stockByLocation[stockIndex].quantity;
            quantityChanged = newStock - previousStock;
            
            const newStockByLocation = [...product.stockByLocation];
            newStockByLocation[stockIndex] = { ...newStockByLocation[stockIndex], quantity: newStock };

            transaction.update(productRef, { stockByLocation: newStockByLocation });
        });

        // Create transaction log after the atomic update
        await addDoc(collection(db, "inventoryTransactions"), {
            productId,
            locationId,
            type: 'adjustment',
            quantity: quantityChanged,
            previousStock,
            newStock,
            notes: `${reason}${notes ? `: ${notes}` : ''}`,
            date: serverTimestamp(),
        });

        return NextResponse.json({ message: 'Stock adjusted and logged successfully' }, { status: 200 });
    } catch (error) {
        console.error("Stock adjustment error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
