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
    const userId = await getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: userId,
          points: 0,
          tier: 'bronze',
          lifetime_points: 0
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return NextResponse.json({ loyalty: newData });
    }

    return NextResponse.json({ loyalty: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch loyalty' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { points } = await request.json();

    const { data, error } = await supabase
      .from('loyalty_points')
      .upsert({
        user_id: userId,
        points,
        lifetime_points: points,
        tier: points > 10000 ? 'platinum' : points > 5000 ? 'gold' : points > 1000 ? 'silver' : 'bronze'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ loyalty: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update loyalty' }, { status: 500 });
  }
}