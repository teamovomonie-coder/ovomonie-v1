import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const updatedSupplier = await db.suppliers.update(params.id, body);
        if (!updatedSupplier) {
            return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
        }
        return NextResponse.json(updatedSupplier);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const deletedSupplier = await db.suppliers.delete(params.id);
        if (!deletedSupplier) {
            return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Supplier deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
