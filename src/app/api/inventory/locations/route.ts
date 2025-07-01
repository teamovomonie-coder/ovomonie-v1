import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function GET() {
    try {
        const locations = await db.locations.findMany();
        return NextResponse.json(locations);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newLocation = await db.locations.create(body);
        return NextResponse.json(newLocation, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
