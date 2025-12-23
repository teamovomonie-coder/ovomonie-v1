
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
// Firebase removed - using Supabase
// Firebase removed - using Supabase
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const holdingsQuery = query(supabaseAdmin.from("stockHoldings"), where("userId", "==", userId));
        const querySnapshot = await supabaseAdmin.select("*").then(({data}) => data || []).then(items => holdingsQuery);
        
        const holdings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(holdings);

    } catch (error) {
        logger.error("Portfolio API Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
