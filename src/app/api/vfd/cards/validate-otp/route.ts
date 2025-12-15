import { NextRequest, NextResponse } from 'next/server';
import { validateOtp } from '@/lib/vfd';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { reference, otp } = body;
    
    if (!reference || !otp) {
      return NextResponse.json({ ok: false, message: 'Missing reference or otp' }, { status: 400 });
    }

    const res = await validateOtp(otp, reference);
    
    // Map VFD response to our format
    const success = res.data?.status === '00' || res.ok;
    
    return NextResponse.json({
      ok: success,
      message: res.data?.message || (success ? 'OTP validated successfully' : 'OTP validation failed'),
      data: res.data,
    }, { status: success ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
