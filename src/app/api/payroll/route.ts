
import { NextResponse } from 'next/server';
// Firebase removed - using Supabase
// Firebase removed - using Supabase
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that payroll GET request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('payroll GET request received', { authPresent: Boolean(authHeader), path: '/api/payroll' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in payroll GET');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const q = query(supabaseAdmin.from("payrollBatches"), where('userId', '==', userId));
        const querySnapshot = await supabaseAdmin.select("*").then(({data}) => data || []).then(items => q);
        const batches = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            paymentDate: doc.data().paymentDate?.toDate(),
        }));
        return NextResponse.json(batches);
    } catch (error) {
        logger.error("Error fetching payroll batches:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug: log that payroll POST request arrived and whether auth header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('payroll POST request received', { authPresent: Boolean(authHeader), path: '/api/payroll' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in payroll POST');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...batchData } = body; // Exclude client-generated draft ID

        const newBatch = {
            ...batchData,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await supabaseAdmin.insert(newBatch);
        const savedBatch = { id: docRef.id, ...newBatch };
        
        return NextResponse.json(savedBatch, { status: 201 });
    } catch (error) {
        logger.error("Error creating payroll batch:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
