
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction, collection, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { lineItems, referenceId } = body as { lineItems: { productId: string, quantity: number }[], referenceId: string };

        if (!lineItems || !referenceId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        for (const item of lineItems) {
            const productRef = doc(db, "products", item.productId);
            
            try {
                await runTransaction(db, async (transaction) => {
                    const productDoc = await transaction.get(productRef);
                    if (!productDoc.exists()) {
                         logger.warn(`Product with ID ${item.productId} not found for sale ${referenceId}. Skipping.`);
                        return;
                    }

                    const product = productDoc.data();
                    const firstLocationWithStock = product.stockByLocation.find((s: any) => s.quantity >= item.quantity);
                    
                    if (firstLocationWithStock) {
                        const stockIndex = product.stockByLocation.findIndex((s: any) => s.locationId === firstLocationWithStock.locationId);
                        const previousStock = product.stockByLocation[stockIndex].quantity;
                        const newStock = previousStock - item.quantity;

                        const newStockByLocation = [...product.stockByLocation];
                        newStockByLocation[stockIndex] = { ...newStockByLocation[stockIndex], quantity: newStock };
                        
                        transaction.update(productRef, { stockByLocation: newStockByLocation });

                        await addDoc(collection(db, "inventoryTransactions"), {
                            productId: productDoc.id,
                            locationId: firstLocationWithStock.locationId,
                            type: 'sale',
                            quantity: -item.quantity, 
                            previousStock,
                            newStock,
                            notes: `Sale from Invoice ${referenceId}`,
                            referenceId,
                            date: serverTimestamp(),
                        });
                    } else {
                        logger.warn(`Insufficient stock for product ${product.name} (ID: ${productDoc.id}) to fulfill sale for invoice ${referenceId}`);
                    }
                });
            } catch (error) {
                 logger.error(`Transaction failed for product ${item.productId}:`, error);
            }
        }

        return NextResponse.json({ message: 'Sales logged and stock updated' }, { status: 200 });
    } catch (error) {
        logger.error('Sale logging error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
