import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/vfd';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    const token = await getAccessToken(force);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
