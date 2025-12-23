import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { userService, transactionService } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Mock investments data for now
        const investments = [
            {
                id: '1',
                userId,
                plan: 'Fixed Deposit',
                principal: 100000,
                returns: 15000,
                status: 'Active',
                startDate: new Date().toISOString(),
                maturityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
        ];

        return NextResponse.json(investments);
    } catch (error) {
        logger.error("Error fetching investments: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { productId, amount, duration, estimatedReturn, clientReference } = await request.json();

        if (!productId || !amount || !duration || amount <= 0) {
            return NextResponse.json({ message: 'Missing required investment fields.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        const amountInKobo = Math.round(amount * 100);
        
        const user = await userService.getById(userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        
        if (user.balance < amountInKobo) {
            return NextResponse.json({ message: 'Insufficient funds for this investment.' }, { status: 400 });
        }
        
        const newBalance = user.balance - amountInKobo;
        await userService.updateBalance(userId, newBalance);
        
        await transactionService.create({
            user_id: userId,
            category: 'investment',
            type: 'debit',
            amount: amountInKobo,
            reference: clientReference,
            narration: `Investment in ${productId}`,
            party_name: 'Ovo-Wealth',
            balance_after: newBalance,
        });

        return NextResponse.json({
            message: "Investment successful!",
            newBalanceInKobo: newBalance,
            investmentId: clientReference,
        }, { status: 201 });

    } catch (error) {
        logger.error("Investment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}