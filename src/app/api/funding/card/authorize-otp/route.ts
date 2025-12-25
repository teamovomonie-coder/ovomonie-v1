import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { authorizeCardOtp } from '@/lib/vfd';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { reference, otp } = body;
    
    if (!reference || !otp) {
      return NextResponse.json({ ok: false, message: 'Missing reference or OTP' }, { status: 400 });
    }

    logger.info('Authorizing card payment with OTP', { reference });

    const res = await authorizeCardOtp({ reference, otp });
    
    const success = res.data?.status === '00' || res.ok;
    
    return NextResponse.json({
      ok: success,
      message: res.data?.message || res.data?.narration || (success ? 'Payment authorized successfully' : 'Authorization failed'),
      data: res.data,
    }, { status: success ? 200 : 400 });
  } catch (err) {
    logger.error('OTP authorization error:', err);
    const message = err instanceof Error ? err.message : 'Authorization failed';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}