import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { generatePaymentWidgetUrl } from '@/lib/vfd-payment-widget';
import { userService, transactionService, notificationService } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, reference } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ ok: false, message: 'Invalid amount' }, { status: 400 });
        }
        if (!reference) {
            return NextResponse.json({ ok: false, message: 'Reference required' }, { status: 400 });
        }

        const user = await userService.getById(userId);
        if (!user) {
            return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
        }

        const amountKobo = Math.round(amount * 100);
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/funding/deposit/callback`;

        const paymentUrl = generatePaymentWidgetUrl({
            amount: amountKobo,
            email: user.email || `${user.phone}@ovomonie.app`,
            reference,
            callbackUrl,
            customerName: user.full_name,
            phone: user.phone,
        });

        logger.info('Deposit: Payment widget URL generated', { userId, reference, amount: amountKobo });

        return NextResponse.json({
            ok: true,
            data: {
                paymentUrl,
                reference,
                amount: amountKobo,
            },
        });

    } catch (error) {
        logger.error('Deposit error:', error);
        const message = error instanceof Error ? error.message : 'Deposit failed';
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
