import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function GET() {
    try {
        const categories = await db.categories.findMany();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newCategory = await db.categories.create(body);
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
