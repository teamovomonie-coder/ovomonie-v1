
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';


// Mock market data - in a real app, this would come from a live feed API.
const mockStocks = [
    { symbol: 'MTNN', name: 'MTN Nigeria', price: 215.50, change: 5.20, category: 'Telecom' },
    { symbol: 'ZENITHBANK', name: 'Zenith Bank', price: 35.80, change: -0.15, category: 'Banking' },
    { symbol: 'GTCO', name: 'Guaranty Trust Holding', price: 38.00, change: 1.25, category: 'Banking' },
    { symbol: 'DANGCEM', name: 'Dangote Cement', price: 350.00, change: -2.50, category: 'Industrial' },
    { symbol: 'BUACEMENT', name: 'BUA Cement', price: 98.00, change: 0.50, category: 'Industrial' },
    { symbol: 'SEPLAT', name: 'Seplat Energy', price: 1500.00, change: 25.00, category: 'Oil & Gas' },
];

export async function GET(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        // Return the mock data
        return NextResponse.json(mockStocks);

    } catch (error) {
        logger.error("Market Data API Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
