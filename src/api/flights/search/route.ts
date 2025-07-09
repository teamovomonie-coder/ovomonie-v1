
import { NextResponse } from 'next/server';

const airlines = [
    { code: 'P4', name: 'Air Peace' },
    { code: '9J', name: 'Dana Air' },
    { code: 'W3', name: 'Arik Air' },
    { code: 'Q9', name: 'Ibom Air' },
];

function getRandomAirline() {
    return airlines[Math.floor(Math.random() * airlines.length)];
}

function getRandomTime() {
    const hour = String(Math.floor(Math.random() * 12) + 7).padStart(2, '0'); // 7 AM to 6 PM
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${hour}:${minute}`;
}

function getRandomDuration() {
    const hours = 1;
    const minutes = Math.floor(Math.random() * 30) + 10; // 10 to 40 mins
    return `${hours}h ${minutes}m`;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        
        if (!from || !to) {
            return NextResponse.json({ message: 'Departure and destination are required.' }, { status: 400 });
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockFlights = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, i) => {
            const airline = getRandomAirline();
            const departureTime = getRandomTime();
            
            return {
                id: `flight-${from}-${to}-${i}-${Date.now()}`,
                airline: airline,
                departure: { airport: from, time: departureTime },
                arrival: { airport: to, time: "10:30" }, // This would be calculated in a real app
                duration: getRandomDuration(),
                price: Math.floor(Math.random() * 30000) + 45000, // Price between 45k and 75k
            };
        });

        return NextResponse.json(mockFlights);

    } catch (error) {
        console.error("Flight Search Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
