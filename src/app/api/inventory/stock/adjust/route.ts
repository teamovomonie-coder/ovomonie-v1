import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        const body = await request.json();
        const { productId, locationId, newStock, reason, notes } = body;

        if (!productId || !locationId || newStock === undefined || !reason) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Get current product stock
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        // Find stock for location
        const stockByLocation = product.stock_by_location || [];
        const stockIndex = stockByLocation.findIndex((s: any) => s.locationId === locationId);
        
        if (stockIndex === -1) {
            return NextResponse.json({ message: 'Location not found for this product' }, { status: 404 });
        }

        const previousStock = stockByLocation[stockIndex].quantity;
        const quantityChanged = newStock - previousStock;

        // Update stock
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
                type: 'adjustment',
                quantity: quantityChanged,
                previous_stock: previousStock,
                new_stock: newStock,
                notes: `${reason}${notes ? `: ${notes}` : ''}`,
                created_at: new Date().toISOString(),
            });

        if (logError) throw logError;

        return NextResponse.json({ message: 'Stock adjusted and logged successfully' }, { status: 200 });
    } catch (error) {
        logger.error("Stock adjustment error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}