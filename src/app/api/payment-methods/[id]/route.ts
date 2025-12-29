import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = request.headers as { get(name: string): string };
    const userId = getUserIdFromToken(reqHeaders);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('saved_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (error) {
    logger.error('Error deleting payment method:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
