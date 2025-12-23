
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { hashSecret } from '@/lib/auth';
import { validateTransactionPin } from '@/lib/pin-validator';
import { logger } from '@/lib/logger';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;



export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { currentPin, newPin } = await request.json();

        if (!currentPin || !newPin) {
            return NextResponse.json({ message: 'Current and new PINs are required.' }, { status: 400 });
        }

        if (String(newPin).length !== 4) {
            return NextResponse.json({ message: 'New PIN must be 4 digits.' }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
        }

        // Get user from Supabase
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('transaction_pin_hash')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            logger.error('User not found:', userError);
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        // Validate current PIN
        const currentMatches = validateTransactionPin(String(currentPin), userData.transaction_pin_hash || '');

        if (!currentMatches) {
            return NextResponse.json({ message: 'Incorrect current PIN.' }, { status: 401 });
        }

        if (String(currentPin) === String(newPin)) {
            return NextResponse.json({ message: 'New PIN cannot be the same as the old PIN.' }, { status: 400 });
        }

        // Update PIN in Supabase
        const { error: updateError } = await supabase!
            .from('users')
            .update({ transaction_pin_hash: hashSecret(String(newPin)) })
            .eq('id', userId);

        if (updateError) {
            logger.error('Failed to update PIN:', updateError);
            return NextResponse.json({ message: 'Failed to update PIN.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Transaction PIN changed successfully.' });

    } catch (error) {
        logger.error("Change PIN Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
