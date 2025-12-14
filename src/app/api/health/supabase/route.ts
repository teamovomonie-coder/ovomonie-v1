import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ ok: false, message: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: false, message: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Admin client unavailable on client-side' }, { status: 500 });
    }

    // Test Supabase connectivity using admin client to bypass RLS
    const { data, error, status } = await supabaseAdmin.from('users').select('id').limit(1);

    if (error) {
      return NextResponse.json({
        ok: false,
        message: 'Supabase connection failed',
        error: error.message,
        status,
        details: (error as any)?.hint || (error as any)?.details || null,
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Supabase connection healthy', database: 'PostgreSQL (Supabase)' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      ok: false,
      message: 'Health check failed',
      error: message,
    }, { status: 500 });
  }
}
