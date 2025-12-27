import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('reference', reference)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // If account data is missing, try to fetch from financial_transactions
    let senderAccount = data.sender_account;
    let recipientAccount = data.recipient_account;
    
    if (!senderAccount || !recipientAccount || senderAccount === 'N/A' || recipientAccount === 'N/A') {
      const { data: txData } = await supabase
        .from('financial_transactions')
        .select('party')
        .eq('reference', reference)
        .eq('user_id', userId)
        .single();
      
      if (txData?.party) {
        senderAccount = senderAccount || txData.party.account || null;
        recipientAccount = recipientAccount || txData.party.account || null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: data.reference,
        amount: data.amount,
        type: data.type,
        category: data.category,
        narration: data.body,
        timestamp: data.timestamp || data.created_at,
        senderName: data.sender_name || null,
        senderAccount: senderAccount || null,
        senderPhone: data.sender_phone || null,
        recipientName: data.recipient_name || null,
        recipientAccount: recipientAccount || null,
        recipientPhone: data.recipient_phone || null,
      }
    });
  } catch (error) {
    console.error('Transaction details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    );
  }
}