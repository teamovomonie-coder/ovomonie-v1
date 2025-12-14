
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
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
        // Read headers from the incoming request directly to ensure we capture
        // the Authorization header sent from the client fetch call.
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);

        // Debug logging for development: record whether Authorization header was present
        try {
            const authHeader = reqHeaders.get?.('authorization') || reqHeaders.get?.('Authorization') || null;
            logger.debug('verify-pin request received', { authPresent: Boolean(authHeader), path: '/api/auth/verify-pin' });
        } catch (e) {
            logger.warn('Could not read authorization header for debug logging in verify-pin');
        }
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { pin } = await request.json();

        // Log the incoming body minimally in dev to help debugging (do not log sensitive tokens)
        try {
            logger.debug('verify-pin payload', { pinProvided: typeof pin === 'string' && pin.length > 0 });
        } catch (e) {
            logger.warn('Could not log verify-pin payload');
        }

        if (!pin || String(pin).length !== 4) {
            return NextResponse.json({ message: 'A valid 4-digit transaction PIN is required.' }, { status: 400 });
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

        // Validate transaction PIN using pin-validator
        const isValid = validateTransactionPin(String(pin), userData.transaction_pin_hash || '');

        if (isValid) {
            return NextResponse.json({ success: true, message: 'PIN verified.' });
        } else {
            return NextResponse.json({ success: false, message: 'The PIN you entered is incorrect.' }, { status: 401 });
        }

    } catch (error) {
        logger.error("PIN Verification Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
