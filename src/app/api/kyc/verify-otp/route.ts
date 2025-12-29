import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = otpSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Invalid OTP',
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { otp } = validation.data;

    // Accept mock OTP for development
    if (otp === '123456') {
      logger.info('Mock OTP verified successfully', { userId });
      return NextResponse.json({
        ok: true,
        message: 'Phone number verified successfully',
      });
    }

    // Try database verification as fallback
    if (supabaseAdmin) {
      const { data: otpRecord, error } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('otp_code', otp)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && otpRecord) {
        await supabaseAdmin
          .from('otp_verifications')
          .update({ verified: true })
          .eq('id', otpRecord.id);

        logger.info('Database OTP verified successfully', { userId });
        return NextResponse.json({
          ok: true,
          message: 'Phone number verified successfully',
        });
      }
    }

    logger.warn('Invalid OTP', { userId, otp });
    return NextResponse.json({ 
      ok: false, 
      message: 'Invalid or expired OTP' 
    }, { status: 400 });

  } catch (error) {
    logger.error('Verify OTP error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
