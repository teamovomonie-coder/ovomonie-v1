
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
    query,
    where,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';


export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that the payment request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('payment request received', { authPresent: Boolean(authHeader), path: '/api/payments' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in payments');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, category, party, narration, clientReference } = body;
        
        logger.info('[Payments API] Request body:', body);

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            logger.error('[Payments API] Invalid amount:', { amount });
            return NextResponse.json({ message: 'A valid amount is required.' }, { status: 400 });
        }
        if (!category) {
            logger.error('[Payments API] Missing category');
            return NextResponse.json({ message: 'Category is required.' }, { status: 400 });
        }
        if (!party) {
            logger.error('[Payments API] Missing party');
            return NextResponse.json({ message: 'Party details are required.' }, { status: 400 });
        }
        if (!clientReference) {
            logger.error('[Payments API] Missing clientReference');
            return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
        }

        // Use Supabase for balance management
        const { userService, transactionService } = await import('@/lib/db');
        
        const user = await userService.getById(userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const amountInKobo = Math.round(amount * 100);
        
        if (user.balance < amountInKobo) {
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        const newBalance = user.balance - amountInKobo;
        await userService.updateBalance(userId, newBalance);
        
        await transactionService.create({
            user_id: userId,
            reference: clientReference,
            type: 'debit',
            category: category,
            amount: amountInKobo,
            narration: narration || `Payment for ${party.name}`,
            party: party,
            balance_after: newBalance,
        });
        
        // Save to pending_transactions for receipt display
        const { db: supabase } = await import('@/lib/db');
        await supabase.from('pending_transactions').insert({
            user_id: userId,
            type: category,
            reference: clientReference,
            amount: amount,
            data: {
                network: party.name,
                phoneNumber: party.billerId,
                amount: amount,
            },
            status: 'completed',
        });

        return NextResponse.json({
            message: 'Payment successful!',
            newBalanceInKobo: newBalance,
            transactionId: clientReference,
        }, { status: 200 });

    } catch (error: any) {
        logger.error("Generic Payment Error:", error);
        return NextResponse.json({ 
            message: error?.message || 'Payment processing failed',
            error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined 
        }, { status: 500 });
    }
}
