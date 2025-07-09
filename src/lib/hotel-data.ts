
export interface Hotel {
    id: string;
    name: string;
    city: string;
    rating: number;
    price: number; // Starting price
    image: string;
    hint: string;
    facilities: string[];
    description: string;
}

export interface Room {
    id: string;
    hotelId: string;
    name: string;
    price: number;
    bed: string;
    refundable: boolean;
    facilities: string[];
}

export interface UserBooking {
    id: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled';
    ref: string;
}

export const mockHotels: Hotel[] = [
    { id: 'hotel-1', name: 'Eko Hotel & Suites', city: 'Lagos', rating: 5, price: 150000, image: 'https://placehold.co/600x400.png', hint: 'luxury hotel', facilities: ['wifi', 'ac', 'breakfast'], description: 'A 5-star hotel in the heart of Victoria Island, offering world-class amenities and breathtaking views of the Atlantic Ocean.' },
    { id: 'hotel-2', name: 'Transcorp Hilton', city: 'Abuja', rating: 5, price: 180000, image: 'https://placehold.co/600x400.png', hint: 'modern hotel', facilities: ['wifi', 'ac', 'breakfast'], description: 'Located in the capital city, this hotel offers a blend of luxury, business facilities, and leisure, with a beautiful landscape.' },
    { id: 'hotel-3', name: 'Hotel Presidential', city: 'Port Harcourt', rating: 4, price: 95000, image: 'https://placehold.co/600x400.png', hint: 'classic hotel', facilities: ['wifi', 'ac'], description: 'A landmark hotel in Port Harcourt, known for its excellent service, comfort, and strategic location in the Garden City.' },
    { id: 'hotel-4', name: 'Protea Hotel by Marriott', city: 'Lagos', rating: 4, price: 120000, image: 'https://placehold.co/600x400.png', hint: 'business hotel', facilities: ['wifi', 'ac', 'breakfast'], description: 'Ideal for business travelers, this hotel in Ikeja offers modern rooms, meeting facilities, and proximity to the airport.' },
    { id: 'hotel-5', name: 'Radisson Blu Anchorage Hotel', city: 'Lagos', rating: 5, price: 165000, image: 'https://placehold.co/600x400.png', hint: 'sleek hotel waterfront', facilities: ['wifi', 'ac', 'breakfast'], description: 'A stunning waterfront hotel in Victoria Island with stylish rooms, a wellness center, and fine dining options.' },
];

export const mockRooms: Room[] = [
    // Eko Hotel
    { id: 'room-1', hotelId: 'hotel-1', name: 'Standard Room', price: 150000, bed: '1 Queen Bed', refundable: true, facilities: ['wifi', 'ac'] },
    { id: 'room-2', hotelId: 'hotel-1', name: 'Deluxe Suite', price: 250000, bed: '1 King Bed', refundable: true, facilities: ['wifi', 'ac', 'breakfast'] },
    // Transcorp Hilton
    { id: 'room-3', hotelId: 'hotel-2', name: 'Executive Room', price: 180000, bed: '1 King Bed', refundable: false, facilities: ['wifi', 'ac', 'breakfast'] },
    { id: 'room-4', hotelId: 'hotel-2', name: 'King Guest Room', price: 220000, bed: '1 King Bed', refundable: true, facilities: ['wifi', 'ac', 'breakfast'] },
    // Hotel Presidential
    { id: 'room-5', hotelId: 'hotel-3', name: 'Classic Double', price: 95000, bed: '2 Double Beds', refundable: true, facilities: ['wifi', 'ac'] },
    // Protea Hotel
    { id: 'room-6', hotelId: 'hotel-4', name: 'Standard Queen', price: 120000, bed: '1 Queen Bed', refundable: true, facilities: ['wifi', 'ac', 'breakfast'] },
    // Radisson Blu
    { id: 'room-7', hotelId: 'hotel-5', name: 'Superior Room - City View', price: 165000, bed: '1 King Bed', refundable: true, facilities: ['wifi', 'ac', 'breakfast'] },
];
