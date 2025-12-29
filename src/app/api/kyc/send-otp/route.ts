import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Service unavailable' }, { status: 503 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (!user?.phone) {
      return NextResponse.json({ ok: false, message: 'Phone number not found' }, { status: 404 });
    }

    // Use mock OTP for development
    const otp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Try to store OTP in database, create table if it doesn't exist
    try {
      const { error } = await supabaseAdmin
        .from('otp_verifications')
        .insert({
          user_id: userId,
          phone: user.phone,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          verified: false,
        });

      if (error) {
        logger.error('Failed to store OTP', { userId, error });
        // Continue anyway for development
      }
    } catch (dbError) {
      logger.warn('OTP table may not exist, continuing with mock verification', { dbError });
    }

    logger.info('Mock OTP ready', { userId, phone: user.phone, otp });

    return NextResponse.json({
      ok: true,
      message: 'OTP sent to your phone (Use: 123456)',
      data: { phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') },
    });

  } catch (error) {
    logger.error('Send OTP error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
