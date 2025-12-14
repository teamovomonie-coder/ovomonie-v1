import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Initialize Supabase client (primary)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        // Fetch from Supabase (primary)
        const { data: transactions, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            logger.error('Supabase error fetching transactions:', error);
            return NextResponse.json({ message: 'Failed to fetch transactions' }, { status: 500 });
        }

        return NextResponse.json(transactions || []);
    } catch (error) {
        logger.error("Error fetching financial transactions: ", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
