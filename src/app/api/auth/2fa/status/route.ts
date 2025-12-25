import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('two_factor_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to check 2FA status', { userId, error });
      return NextResponse.json({ message: 'Failed to check 2FA status' }, { status: 500 });
    }

    return NextResponse.json({ enabled: user?.two_factor_enabled || false });
  } catch (error) {
    logger.error('Error in 2FA status check', { error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
