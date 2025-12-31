import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuthToken } from '@/lib/auth';

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

    // Standardized receipt mapping with better data extraction
    const receipt = {
      type: determineTransactionType(transaction),
      reference: transaction.reference,
      amount: Math.round(transaction.amount / 100), // Ensure integer conversion
      phoneNumber: extractPhoneNumber(transaction),
      network: extractNetwork(transaction),
      planName: extractPlanName(transaction),
      transactionId: transaction.id, // Use unique transaction ID
      completedAt: transaction.created_at,
      isDataPlan: isDataTransaction(transaction)
    };

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

function determineTransactionType(transaction: any): 'AIRTIME' | 'DATA' {
  const category = transaction.category?.toLowerCase() || '';
  const narration = transaction.narration?.toLowerCase() || '';
  
  if (narration.includes('data') || category === 'data') {
    return 'DATA';
  }
  
  return 'AIRTIME';
}

function extractPhoneNumber(transaction: any): string {
  return transaction.party?.billerId || 
         transaction.metadata?.recipient || 
         '';
}

function extractNetwork(transaction: any): string {
  // Try multiple sources for network name
  const network = transaction.party?.name || 
                 transaction.metadata?.network || 
                 'Unknown';
  
  // Normalize network names to match logo keys
  const networkMap: Record<string, string> = {
    'MTN': 'mtn',
    'Airtel': 'airtel', 
    'Glo': 'glo',
    '9mobile': '9mobile',
    '9Mobile': '9mobile'
  };
  
  return networkMap[network] || network.toLowerCase();
}

function extractPlanName(transaction: any): string | undefined {
  // Try multiple sources for plan name
  const planName = transaction.party?.planName || 
                   transaction.metadata?.plan_name ||
                   extractPlanFromNarration(transaction.narration);
  
  return planName || undefined;
}

function extractPlanFromNarration(narration?: string): string | undefined {
  if (!narration) return undefined;
  
  const match = narration.match(/Data purchase: (.+?) for/);
  return match ? match[1] : undefined;
}

function isDataTransaction(transaction: any): boolean {
  const category = transaction.category?.toLowerCase() || '';
  const narration = transaction.narration?.toLowerCase() || '';
  
  return narration.includes('data') || category === 'data';
}
