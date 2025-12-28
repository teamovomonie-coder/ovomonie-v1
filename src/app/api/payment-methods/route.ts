import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const { data: cards, error } = await supabaseAdmin
      .from('saved_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (cards || []).map(card => ({
      id: card.id,
      last4: card.last4,
      brand: card.brand,
      expiry: card.expiry
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
