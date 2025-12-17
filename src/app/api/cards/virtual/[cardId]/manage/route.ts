import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { verifyAuthToken } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header missing.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    const userId = decoded.sub;
    const { cardId } = await params;
    const body = await request.json();
    const { action } = body; // 'deactivate' or 'delete'

    if (!['deactivate', 'delete'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
    }

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from('users_virtual_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ message: 'Virtual card not found.' }, { status: 404 });
    }

    if (action === 'deactivate') {
      // Mark card as inactive
      const { error } = await supabase
        .from('users_virtual_cards')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cardId);

      if (error) {
        logger.error('Error deactivating virtual card:', error);
        return NextResponse.json(
          { message: 'Failed to deactivate virtual card.' },
          { status: 500 }
        );
      }

      logger.info(`Virtual card deactivated for user ${userId}`, { cardId });

      return NextResponse.json({
        success: true,
        cardId,
        message: 'Virtual card deactivated successfully.',
      });
    }

    if (action === 'delete') {
      // Delete the card
      const { error } = await supabase
        .from('users_virtual_cards')
        .delete()
        .eq('id', cardId);

      if (error) {
        logger.error('Error deleting virtual card:', error);
        return NextResponse.json(
          { message: 'Failed to delete virtual card.' },
          { status: 500 }
        );
      }

      logger.info(`Virtual card deleted for user ${userId}`, { cardId });

      return NextResponse.json({
        success: true,
        cardId,
        message: 'Virtual card deleted successfully.',
      });
    }
  } catch (error) {
    logger.error('Virtual card manage error:', error);
    return NextResponse.json(
      { message: 'An error occurred while managing the virtual card.' },
      { status: 500 }
    );
  }
}
