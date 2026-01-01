import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Vercel serverless function configuration
export const runtime = 'nodejs';
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Transaction ID required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not available' }, { status: 500 });
    }

    // First try pending_transactions (pending receipts)
    const { data, error } = await supabaseAdmin
      .from('pending_transactions')
      .select('*')
      .eq('reference', id)
      .eq('user_id', userId)
      .single();

    if (data) {
      return NextResponse.json({ ok: true, transaction: data });
    }

    // Fallback: try financial_transactions by id first (exact match)
    try {
      // First try by exact ID match
      let finData: any = null;
      let finError: any = null;

      if (!supabaseAdmin) {
        return NextResponse.json({ ok: false, message: 'Database not available' }, { status: 500 });
      }

      // Try ID match first (most specific)
      const { data: idData, error: idError } = await supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (idData && !idError) {
        finData = idData;
      } else {
        // If ID doesn't match, try reference (but only if ID is not a valid UUID format)
        // This prevents matching wrong transactions when ID is actually a reference
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (!isUUID) {
          // ID is likely a reference, try matching by reference
          const { data: refData, error: refError } = await supabaseAdmin
            .from('financial_transactions')
            .select('*')
            .eq('reference', id)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (refData && !refError) {
            finData = refData;
          } else {
            finError = refError;
          }
        } else {
          finError = idError;
        }
      }

      if (finError || !finData) {
        logger.warn('Transaction not found in pending or financial_transactions:', { id, userId, finError });
        return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
      }

      // CRITICAL: Verify the transaction matches the requested ID/reference exactly
      // This prevents returning wrong/stale transactions
      if (finData.id !== id && finData.reference !== id) {
        logger.warn('Transaction ID/reference mismatch:', { requested: id, found: { id: finData.id, ref: finData.reference } });
        return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
      }

      // Note: financial_transactions table doesn't have a status column
      // Transactions in this table are considered completed
      // If transaction exists in financial_transactions, it's completed

      // Map financial_transactions fields to the shape expected by the receipt page
      const party = finData.party || {};
      const metadata = finData.metadata || {};
      
      const mapped = {
        id: finData.id,
        reference: finData.reference,
        type: finData.type,
        amount: finData.amount,
        narration: finData.narration,
        party_name: party.name || metadata.network || finData.party_name || '',
        party_account: party.billerId || metadata.phoneNumber || finData.party_account || '',
        party: party, // Include full party object for transfers
        balance_after: finData.balance_after,
        status: 'completed', // Always mark as completed for financial_transactions
        category: finData.category,
        metadata: {
          service_type: finData.category,
          recipient: party.billerId || metadata.phoneNumber || finData.party_account || '',
          network: party.name || metadata.network || '',
          phoneNumber: party.billerId || metadata.phoneNumber || finData.party_account || '',
          plan_name: party.planName || metadata.plan_name || '',
          bankName: party.bank || metadata.bankName || (finData.category === 'transfer' ? 'Ovomonie' : ''),
          bankCode: metadata.bankCode || party.bankCode || '',
          recipientName: party.name || metadata.recipientName || finData.party_name || '',
          accountNumber: party.account || metadata.accountNumber || finData.party_account || '',
          isInternal: metadata.isInternal || (finData.category === 'transfer' && !metadata.bankCode),
          transferType: metadata.transferType || (finData.category === 'transfer' && !metadata.bankCode ? 'internal' : 'external'),
          memoMessage: metadata.memoMessage || metadata.message,
          message: metadata.message || metadata.memoMessage,
          vfd_reference: finData.reference,
          ...metadata, // Spread all other metadata
        },
        created_at: finData.timestamp || finData.created_at,
      };

      return NextResponse.json({ ok: true, transaction: mapped });
    } catch (err) {
      logger.error('Error fetching from financial_transactions:', err);
      return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
    }
  } catch (error) {
    logger.error('Transaction fetch error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
