import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }

        // Fetch all data in parallel
        const [transactionsResult, productsResult, locationsResult] = await Promise.all([
            supabaseAdmin.from('stock_transactions').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('products').select('*'),
            supabaseAdmin.from('locations').select('*')
        ]);

        if (transactionsResult.error) throw transactionsResult.error;
        if (productsResult.error) throw productsResult.error;
        if (locationsResult.error) throw locationsResult.error;

        const transactions = transactionsResult.data || [];
        const products = productsResult.data || [];
        const locations = locationsResult.data || [];

        // Create lookup maps
        const productMap = new Map(products.map(p => [p.id, p]));
        const locationMap = new Map(locations.map(l => [l.id, l]));

        // Enrich transactions with product and location data
        const enrichedTransactions = transactions.map(transaction => {
            const product = productMap.get(transaction.product_id);
            const location = locationMap.get(transaction.location_id);

            return {
                id: transaction.id,
                productId: transaction.product_id,
                productName: product?.name || 'Unknown Product',
                locationId: transaction.location_id,
                locationName: location?.name || 'Unknown Location',
                type: transaction.type,
                quantity: transaction.quantity,
                previousStock: transaction.previous_stock,
                newStock: transaction.new_stock,
                unitPrice: transaction.unit_price,
                totalAmount: transaction.total_amount,
                customerId: transaction.customer_id,
                notes: transaction.notes,
                date: transaction.created_at,
            };
        });

        return NextResponse.json(enrichedTransactions);
    } catch (error) {
        logger.error("Error fetching inventory transactions: ", error);
        
        let errorMessage = 'Internal Server Error';
        if (error instanceof Error && error.message.includes('index')) {
            errorMessage = "The database is missing a required index. Please check the server logs for a link to create it in the database console.";
        }
        
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}