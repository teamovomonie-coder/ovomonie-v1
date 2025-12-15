import { NextRequest, NextResponse } from 'next/server';
import { paymentDetails } from '@/lib/vfd';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Missing reference parameter' }, { status: 400 });
    }

    const res = await paymentDetails(reference);
    
    // Map VFD response to our format
    const success = res.data?.status === '00' || res.data?.transactionStatus === '00';
    
    return NextResponse.json({
      ok: success,
      message: res.data?.message || res.data?.transactionMessage || 'Status retrieved',
      data: {
        status: res.data?.transactionStatus || res.data?.status,
        message: res.data?.transactionMessage || res.data?.message,
        amount: res.data?.amount,
        reference: res.data?.reference,
        description: res.data?.transactionDescription,
      },
    }, { status: res.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
