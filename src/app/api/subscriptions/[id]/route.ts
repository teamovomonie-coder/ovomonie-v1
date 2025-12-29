import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json();
    const { action } = body;

    if (!['pause', 'cancel', 'resume'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      pause: 'paused',
      cancel: 'cancelled',
      resume: 'active'
    };

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: statusMap[action],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: `Subscription ${action}d successfully`, data });
  } catch (error) {
    logger.error('Error updating subscription:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

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
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    logger.error('Error deleting subscription:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
