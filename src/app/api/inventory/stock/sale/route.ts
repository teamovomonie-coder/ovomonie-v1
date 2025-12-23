import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await request.json();
        const { lineItems, totalAmount, customerId, notes } = body;

        if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
            return NextResponse.json({ message: 'Line items are required' }, { status: 400 });
        }

        // Process each line item
        for (const item of lineItems) {
            const { productId, locationId, quantity, unitPrice } = item;

            if (!productId || !locationId || !quantity || quantity <= 0) {
                return NextResponse.json({ message: 'Invalid line item data' }, { status: 400 });
            }

            // Get current product stock
            const { data: product, error: productError } = await supabaseAdmin
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (productError || !product) {
                return NextResponse.json({ message: `Product ${productId} not found` }, { status: 404 });
            }

            // Find stock for location
            const stockByLocation = product.stock_by_location || [];
            const stockIndex = stockByLocation.findIndex((s: any) => s.locationId === locationId);
            
            if (stockIndex === -1) {
                return NextResponse.json({ message: `Location not found for product ${productId}` }, { status: 404 });
            }

            const currentStock = stockByLocation[stockIndex].quantity;
            if (currentStock < quantity) {
                return NextResponse.json({ message: `Insufficient stock for product ${productId}` }, { status: 400 });
            }

            // Update stock
            const newStock = currentStock - quantity;
            const newStockByLocation = [...stockByLocation];
            newStockByLocation[stockIndex] = { ...newStockByLocation[stockIndex], quantity: newStock };

            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({ stock_by_location: newStockByLocation })
                .eq('id', productId);

            if (updateError) throw updateError;

            // Create transaction log
            const { error: logError } = await supabaseAdmin
                .from('stock_transactions')
                .insert({
                    product_id: productId,
                    location_id: locationId,
                    type: 'sale',
                    quantity: -quantity,
                    previous_stock: currentStock,
                    new_stock: newStock,
                    unit_price: unitPrice,
                    total_amount: quantity * unitPrice,
                    customer_id: customerId,
                    notes: notes || null,
                    created_at: new Date().toISOString(),
                });

            if (logError) throw logError;
        }

        return NextResponse.json({ message: 'Sale processed successfully' }, { status: 200 });
    } catch (error) {
        logger.error("Stock sale error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}