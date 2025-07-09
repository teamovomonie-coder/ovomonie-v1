
import { NextResponse } from 'next/server';
import { mockHotels } from '@/lib/hotel-data';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location')?.toLowerCase();

        if (!location) {
            return NextResponse.json({ message: 'Location is a required search parameter.' }, { status: 400 });
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const results = mockHotels.filter(hotel => 
            hotel.city.toLowerCase().includes(location) || 
            hotel.name.toLowerCase().includes(location)
        );

        return NextResponse.json(results);

    } catch (error) {
        console.error("Hotel Search Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
