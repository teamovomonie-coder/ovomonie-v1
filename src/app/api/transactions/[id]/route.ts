import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Transaction ID required' }, { status: 400 });
    }

    // First try pending_transactions (pending receipts)
<<<<<<< HEAD
    const { data, error } = await db
=======
    const { data, error } = await supabaseAdmin
>>>>>>> origin/main
      .from('pending_transactions')
      .select('*')
      .eq('reference', id)
      .eq('user_id', userId)
      .single();

    if (data) {
<<<<<<< HEAD
      return NextResponse.json({ ok: true, data });
=======
      return NextResponse.json({ ok: true, transaction: data });
>>>>>>> origin/main
    }

    // Fallback: try financial_transactions by id or reference
    try {
<<<<<<< HEAD
      const { data: finData, error: finError } = await db
=======
      const { data: finData, error: finError } = await supabaseAdmin
>>>>>>> origin/main
        .from('financial_transactions')
        .select('*')
        .or(`id.eq.${id},reference.eq.${id}`)
        .eq('user_id', userId)
        .single();

      if (finError || !finData) {
        logger.warn('Transaction not found in pending or financial_transactions:', { id, userId, finError });
        return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
      }

      // Map financial_transactions fields to the shape expected by the receipt page
      const mapped = {
        id: finData.id,
        reference: finData.reference,
        type: finData.type,
        amount: finData.amount,
        narration: finData.narration,
<<<<<<< HEAD
        party_name: finData.party?.name || finData.party_name || null,
        balance_after: finData.balance_after,
        status: finData.status || null,
        category: finData.category,
        metadata: finData.metadata || null,
        created_at: finData.timestamp || finData.created_at || null
      };

      return NextResponse.json({ ok: true, data: mapped });
=======
        party_name: finData.party?.name || finData.party_name || 'External Transfer',
        balance_after: finData.balance_after,
        status: 'completed',
        category: finData.category,
        metadata: {
          service_type: finData.category,
          recipient: finData.party?.name || finData.party_name || 'External Transfer',
          network: finData.party?.bank || 'Bank Transfer',
          vfd_reference: finData.reference,
          ...finData.metadata
        },
        created_at: finData.timestamp || finData.created_at
      };

      return NextResponse.json({ ok: true, transaction: mapped });
>>>>>>> origin/main
    } catch (err) {
      logger.error('Error fetching from financial_transactions:', err);
      return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
    }
  } catch (error) {
    logger.error('Transaction fetch error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
