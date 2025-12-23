
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

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

        if (!supabase) {
            return NextResponse.json({ message: 'Database not configured' }, { status: 500 });
        }

        // Update timestamp to invalidate all tokens issued before this time
        const { error } = await supabase
            .from('users')
            .update({ last_logout_all: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            logger.error('Failed to update logout timestamp:', error);
            return NextResponse.json({ message: 'Failed to logout all devices.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Successfully logged out all other devices.' });

    } catch (error) {
        logger.error("Logout All Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
