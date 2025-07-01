import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function GET() {
    try {
        const products = await db.products.findMany();
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newProduct = await db.products.create(body);
        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
