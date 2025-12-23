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
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ goals: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, target_amount, target_date, category } = await request.json();

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        name,
        target_amount,
        target_date,
        category,
        current_amount: 0
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ goal: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}