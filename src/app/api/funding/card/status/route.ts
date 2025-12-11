import { NextResponse } from 'next/server';
import { paymentDetails } from '@/lib/vfd';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference');
    if (!reference) return NextResponse.json({ message: 'reference query required' }, { status: 400 });

    const res = await paymentDetails(reference);
    logger.debug('VFD payment-details response', { res });
    return NextResponse.json({ success: res.ok, data: res.data }, { status: res.status || 200 });
  } catch (err) {
    logger.error('payment-details error', err);
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
