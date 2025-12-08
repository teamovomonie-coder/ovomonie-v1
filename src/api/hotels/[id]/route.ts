
import { NextResponse } from 'next/server';
import { mockHotels, mockRooms } from '@/lib/hotel-data';
import { logger } from '@/lib/logger';


export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const hotelId = params.id;
        
        const hotel = mockHotels.find(h => h.id === hotelId);
        if (!hotel) {
            return NextResponse.json({ message: 'Hotel not found.' }, { status: 404 });
        }

        const rooms = mockRooms.filter(r => r.hotelId === hotelId);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({ ...hotel, rooms });

    } catch (error) {
        logger.error("Fetch Hotel Details Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
