import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, agentId, clientReference } = await request.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'A valid positive amount is required.' }, { status: 400 });
    }
    if (!agentId) {
      return NextResponse.json({ message: 'Agent ID is required.' }, { status: 400 });
    }
    if (!clientReference) {
      return NextResponse.json({ message: 'Client reference ID is required.' }, { status: 400 });
    }

    // Idempotency check
    const { data: existingTx } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('reference', clientReference)
      .single();

    if (existingTx) {
      logger.info(`Idempotent request for agent funding: ${clientReference} already processed.`);
      const { data: userData } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();
      
      return NextResponse.json({ 
        message: 'Already processed', 
        newBalanceInKobo: userData?.balance || 0 
      }, { status: 200 });
    }

    const amountInKobo = Math.round(amount * 100);

    // Get user's current balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const newBalance = (user.balance || 0) + amountInKobo;

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Create financial transaction record
    const { error: txError } = await supabase
      .from('financial_transactions')
      .insert({
        user_id: userId,
        category: 'deposit',
        type: 'credit',
        amount: amountInKobo,
        reference: clientReference,
        narration: `Agent deposit from ${agentId}`,
        party: { name: `Agent ${agentId}` },
        timestamp: new Date().toISOString(),
        balance_after: newBalance,
      });

    if (txError) {
      throw txError;
    }

    return NextResponse.json(
      { message: 'Agent deposit successful!', newBalanceInKobo: newBalance },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Agent funding error', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
