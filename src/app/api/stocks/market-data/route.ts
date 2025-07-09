
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid.' }, { status: 401 });
        }
        
        // Return the mock data
        return NextResponse.json(mockStocks);

    } catch (error) {
        console.error("Market Data API Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
