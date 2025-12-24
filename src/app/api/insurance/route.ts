import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('insurance')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ policies: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, provider, premium, coverage_amount } = await request.json();

    const { data, error } = await supabase
      .from('insurance')
      .insert({
        user_id: userId,
        type,
        provider,
        premium,
        coverage_amount,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ policy: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}