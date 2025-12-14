import { NextRequest, NextResponse } from 'next/server';
import { initiateCardPayment } from '@/lib/vfd';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const {
      cardNumber,
      expiryDate,
      cvv,
      cardPin,
      amount,
      currency = 'NGN',
      reference,
    } = body;

    if (!cardNumber || !expiryDate || !cvv || !amount) {
      return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
    }

    const res = await initiateCardPayment({
      cardNumber,
      expiryDate,
      cvv,
      pin: cardPin,
      amount,
      currency,
      reference,
    });

    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
