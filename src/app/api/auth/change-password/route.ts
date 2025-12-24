
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { hashSecret } from '@/lib/auth';
import { validateLoginPin } from '@/lib/pin-validator';
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

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Current and new passwords are required.' }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
        }

        // Get user from Supabase
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('login_pin_hash')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            logger.error('User not found:', userError);
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        // Validate current password
        const currentMatches = validateLoginPin(String(currentPassword), userData.login_pin_hash || '');

        if (!currentMatches) {
            return NextResponse.json({ message: 'Incorrect current password.' }, { status: 401 });
        }
        
        if (String(currentPassword) === String(newPassword)) {
            return NextResponse.json({ message: 'New password cannot be the same as the old password.' }, { status: 400 });
        }
        
        // Update password in Supabase
        const { error: updateError } = await supabase!
            .from('users')
            .update({ login_pin_hash: hashSecret(String(newPassword)) })
            .eq('id', userId);

        if (updateError) {
            logger.error('Failed to update password:', updateError);
            return NextResponse.json({ message: 'Failed to update password.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Password changed successfully.' });

    } catch (error) {
        logger.error("Change Password Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
