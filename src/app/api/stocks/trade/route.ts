import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { userService, transactionService } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { stock, quantity, orderType, limitPrice, tradeType, clientReference } = await request.json();

        if (!stock || !quantity || !orderType || !tradeType) {
            return NextResponse.json({ message: 'Missing required trade fields.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
        }

        const price = orderType === 'Limit' ? limitPrice : stock.price;
        const totalCostKobo = Math.round(price * quantity * 100);
        
        const user = await userService.getById(userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        
        if (user.balance < totalCostKobo) {
            return NextResponse.json({ message: 'Insufficient funds for this trade.' }, { status: 400 });
        }
        
        const newBalance = user.balance - totalCostKobo;
        await userService.updateBalance(userId, newBalance);
        
        await transactionService.create({
            user_id: userId,
            category: 'investment',
            type: 'debit',
            amount: totalCostKobo,
            reference: clientReference,
            narration: `Buy ${quantity} units of ${stock.symbol}`,
            party_name: 'NGX Stocks',
            balance_after: newBalance,
        });

        return NextResponse.json({
            message: 'Trade executed successfully!',
            newBalanceInKobo: newBalance,
        }, { status: 200 });

    } catch (error) {
        logger.error("Trade Execution Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}