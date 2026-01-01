import { NextRequest, NextResponse } from 'next/server';

// Vercel serverless function configuration
export const runtime = 'nodejs';
export const maxDuration = 10;
export const dynamic = 'force-dynamic';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/transactions/status?reference=xxx
 * 
 * Checks the status of a transaction by reference.
 * Returns:
 * - 'processing' if transaction is pending or not yet found
 * - 'completed' if transaction is completed
 * - 'failed' if transaction failed
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Reference is required' }, { status: 400 });
    }

    // First check pending_transactions
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not available' }, { status: 500 });
    }
    
    const { data: pendingData, error: pendingError } = await supabaseAdmin
      .from('pending_transactions')
      .select('id, reference, status, user_id')
      .eq('reference', reference)
      .eq('user_id', userId)
      .single();

    if (pendingData) {
      // Transaction is still pending
      if (pendingData.status === 'processing' || pendingData.status === 'pending') {
        return NextResponse.json({
          ok: true,
          status: 'processing',
          transaction: {
            id: pendingData.id,
            reference: pendingData.reference,
            status: pendingData.status,
            category: 'pending',
          },
        });
      }

      // Pending transaction failed
      if (pendingData.status === 'failed') {
        return NextResponse.json({
          ok: true,
          status: 'failed',
          message: 'Transaction failed',
          transaction: {
            id: pendingData.id,
            reference: pendingData.reference,
            status: 'failed',
            category: 'pending',
          },
        });
      }
    }

    // Check financial_transactions (completed transactions)
    // First try by reference (most specific match)
    // Note: financial_transactions doesn't have a status column - it's considered completed
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not available' }, { status: 500 });
    }
    
    const { data: refData, error: refError } = await supabaseAdmin
      .from('financial_transactions')
      .select('id, reference, category')
      .eq('reference', reference)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (refData && refData.reference === reference) {
      // Transaction found in financial_transactions is considered completed
      // Since financial_transactions only stores completed transactions
      // (pending transactions would be in pending_transactions table)
      
      // Transaction is completed - verify reference matches exactly
      return NextResponse.json({
        ok: true,
        status: 'completed',
        transaction: {
          id: refData.id,
          reference: refData.reference,
          status: 'completed',
          category: refData.category || 'transaction',
        },
      });
    }

    // If reference doesn't match, try by ID (only if reference is a valid UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference);
    if (isUUID && supabaseAdmin) {
      const { data: idData, error: idError } = await supabaseAdmin
        .from('financial_transactions')
        .select('id, reference, category')
        .eq('id', reference)
        .eq('user_id', userId)
        .single();

      if (idData && idData.id === reference) {
        // Transaction is completed
        return NextResponse.json({
          ok: true,
          status: 'completed',
          transaction: {
            id: idData.id,
            reference: idData.reference,
            status: 'completed',
            category: idData.category || 'transaction',
          },
        });
      }
    }

    // Transaction not found yet - might still be processing
    // Return processing status to allow polling to continue
    return NextResponse.json({
      ok: true,
      status: 'processing',
      message: 'Transaction not yet confirmed',
    });
  } catch (error) {
    logger.error('Transaction status check error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

