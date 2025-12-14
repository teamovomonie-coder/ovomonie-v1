import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const account_number = searchParams.get('account_number');
    const bank_code = searchParams.get('bank_code');

    if (!account_number || !bank_code) {
      return NextResponse.json({ message: 'Missing account_number or bank_code' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ message: 'Server misconfigured: PAYSTACK_SECRET_KEY missing' }, { status: 500 });
    }

    const resp = await fetch(`https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(bank_code)}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      // Paystack requires GET; ensure no caching issues
      method: 'GET',
    });

    const data = await resp.json().catch(() => ({ message: 'Invalid JSON from Paystack' }));

    if (!resp.ok) {
      const status = resp.status;
      // Normalize common errors
      return NextResponse.json({
        ok: false,
        status,
        message: data?.message || 'Paystack error',
        errors: data?.errors,
      }, { status });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
