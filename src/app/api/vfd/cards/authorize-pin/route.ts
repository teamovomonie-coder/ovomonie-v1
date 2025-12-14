import { NextRequest, NextResponse } from 'next/server';
import { authorizeCardPin } from '@/lib/vfd';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { reference, cardPin } = body;
    if (!reference || !cardPin) {
      return NextResponse.json({ ok: false, message: 'Missing reference or cardPin' }, { status: 400 });
    }

    const res = await authorizeCardPin({ reference, pin: cardPin });
    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
