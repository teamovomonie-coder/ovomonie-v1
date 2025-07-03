import { NextResponse } from 'next/server';
import { db } from '@/lib/inventory-db';

export async function GET() {
    try {
        const transactions = await db.financialTransactions.findMany();
        
        const sortedTransactions = transactions.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return NextResponse.json(sortedTransactions);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
