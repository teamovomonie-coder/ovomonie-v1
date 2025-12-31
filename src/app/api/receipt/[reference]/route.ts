import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuthToken } from '@/lib/auth';
import { nigerianBanks } from '@/lib/banks';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAuthToken(token);
    
    if (!payload || !payload.sub) {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.sub;
    const { reference } = await params;
    
    const searchParams = request.nextUrl.searchParams;
    const txId = searchParams.get('txId');
    const type = searchParams.get('type');

    if (!reference) {
      return NextResponse.json({ ok: false, message: 'Reference required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    // Primary lookup by transaction ID (most reliable)
    let transaction = null;
    let error = null;

    if (txId) {
      const result = await supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('id', txId)
        .eq('user_id', userId)
        .single();
      
      transaction = result.data;
      error = result.error;
    }

    // Fallback to reference lookup
    if (!transaction) {
      const result = await supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('reference', reference)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      transaction = result.data;
      error = result.error;
    }

    if (error || !transaction) {
      return NextResponse.json({ ok: false, message: 'Transaction not found' }, { status: 404 });
    }

    // Create receipt based on transaction type
    let receipt;
    
    if (transaction.category === 'transfer' || type === 'external-transfer') {
      // External transfer receipt
      const bankName = transaction.party?.bank || 'Unknown Bank';
      
      receipt = {
        type: 'external-transfer',
        reference: transaction.reference,
        amount: Math.round(transaction.amount / 100),
        recipientName: transaction.party?.name || 'Unknown Recipient',
        accountNumber: transaction.party?.account || '',
        bankName,
        transactionId: transaction.id,
        completedAt: transaction.created_at,
        narration: transaction.narration
      };
    } else if (transaction.category === 'airtime' || transaction.category === 'data') {
      // Airtime/Data receipt
      receipt = {
        type: transaction.category.toUpperCase() as 'AIRTIME' | 'DATA',
        reference: transaction.reference,
        amount: Math.round(transaction.amount / 100),
        phoneNumber: transaction.party?.billerId || '',
        network: transaction.party?.name || 'Unknown',
        planName: transaction.party?.planName,
        transactionId: transaction.id,
        completedAt: transaction.created_at,
        isDataPlan: transaction.category === 'data'
      };
    } else {
      // Generic receipt
      receipt = {
        type: 'generic',
        reference: transaction.reference,
        amount: Math.round(transaction.amount / 100),
        description: transaction.narration || 'Transaction',
        transactionId: transaction.id,
        completedAt: transaction.created_at,
        category: transaction.category
      };
    }

    return NextResponse.json(
      { ok: true, receipt },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );

  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}