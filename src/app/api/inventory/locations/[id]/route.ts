import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const updatedLocation = await db.locations.update(params.id, body);
        if (!updatedLocation) {
            return NextResponse.json({ message: 'Location not found' }, { status: 404 });
        }
        return NextResponse.json(updatedLocation);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const deletedLocation = await db.locations.delete(params.id);
        if (!deletedLocation) {
            return NextResponse.json({ message: 'Location not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Location deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
