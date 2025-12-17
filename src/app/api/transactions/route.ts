import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { transactionService } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
            const transactions = await transactionService.getByUserId(userId, 100);
            return NextResponse.json({ ok: true, data: transactions });
        } catch (dbError: any) {
            // If table doesn't exist or other DB error, return empty array
            logger.warn('Database error fetching transactions, returning empty array:', dbError);
            return NextResponse.json({ ok: true, data: [] });
        }
    } catch (error) {
        logger.error('Error in transactions API:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
