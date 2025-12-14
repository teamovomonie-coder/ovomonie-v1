
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthToken, verifySecret } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Initialize Supabase client (primary)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { phone, pin } = await request.json();

        if (!phone || !pin) {
            return NextResponse.json({ message: 'Phone number and PIN are required.' }, { status: 400 });
        }

        // Query Supabase (primary)
        const { data: users, error } = await supabase
            .from('users')
            .select('id, phone, full_name, account_number, balance, login_pin_hash')
            .eq('phone', phone)
            .limit(1);

        if (error || !users || users.length === 0) {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

        const userData = users[0];
        const providedPin = String(pin).trim();
        const loginPinHash = userData.login_pin_hash as string | undefined;
        
        if (!loginPinHash) {
            return NextResponse.json({ message: 'Authentication data is incomplete for this user.' }, { status: 401 });
        }

        const isValid = verifySecret(providedPin, loginPinHash);

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid phone number or PIN.' }, { status: 401 });
        }

        let token: string;
        try {
            token = createAuthToken(userData.id);
        } catch (tokenError) {
            logger.error('Failed to generate auth token', tokenError);
            return NextResponse.json({ message: 'Authentication is temporarily unavailable. Please try again later.' }, { status: 500 });
        }

        // Update last login timestamp in Supabase (non-blocking)
        supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userData.id)
            .then(() => {
                logger.info('Last login timestamp updated');
            }, (err) => logger.warn('Failed to update last login:', err));

        return NextResponse.json({
            token,
            userId: userData.id,
            fullName: userData.full_name,
            accountNumber: userData.account_number,
            balance: userData.balance ?? 0,
        });

    } catch (error) {
        logger.error("Login Error:", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
