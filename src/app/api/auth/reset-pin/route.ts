import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashSecret } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { serverEnv } from '@/lib/env.server';


export async function POST(request: Request) {
    try {
        const { phone, newPin } = await request.json();

        if (!phone || !newPin) {
            return NextResponse.json({ message: 'Phone number and new PIN are required.' }, { status: 400 });
        }

        if (String(newPin).length !== 6) {
             return NextResponse.json({ message: 'New PIN must be 6 digits.' }, { status: 400 });
        }

        const supabase = createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('phone', phone)
            .limit(1);

        if (fetchError) {
            throw fetchError;
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No account found with this phone number.' }, { status: 404 });
        }

        const user = users[0];
        if (!user) {
            return NextResponse.json({ message: 'No account found with this phone number.' }, { status: 404 });
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({
                login_pin_hash: hashSecret(String(newPin)),
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ message: 'Your PIN has been reset successfully.' });

    } catch (error) {
        logger.error("PIN Reset Error:", error);
        let errorMessage = 'An internal server error occurred.';
        if (error instanceof Error) {
            errorMessage = `An internal server error occurred: ${error.message}`;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}