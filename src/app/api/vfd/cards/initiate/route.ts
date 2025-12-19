import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { getVFDHeaders } from '@/lib/vfd-auth';
import { logger } from '@/lib/logger';

const VFD_CARDS_BASE = process.env.VFD_CARDS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers as any);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      cardNumber,
      expiryDate,
      cvv,
      cardPin,
      amount,
      reference,
      shouldTokenize,
    } = body;

    if (!cardNumber || !expiryDate || !cvv || !amount || !reference) {
      return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
    }

    const headers = await getVFDHeaders();
    
    const payload = {
      amount: amount.toString(),
      reference,
      useExistingCard: false,
      cardNumber,
      cardPin: cardPin || '1111',
      cvv2: cvv,
      expiryDate,
      shouldTokenize: shouldTokenize || false,
    };

    logger.info('VFD Payment: Initiating', { reference, amount });
    
    // Store payment amount for later retrieval
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('pending_payments').upsert({
        reference,
        user_id: userId,
        amount: Math.round(parseFloat(amount) * 100),
        status: 'pending',
        created_at: new Date().toISOString()
      }, { onConflict: 'reference' });
    }

    const response = await fetch(`${VFD_CARDS_BASE}/initiate/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    logger.info('VFD Payment: Response', { status: response.status, body: text });

    let result: any;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      logger.error('VFD Payment: Failed to parse response', { text });
      return NextResponse.json({ ok: false, message: 'Invalid response from payment gateway' }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ ok: false, message: result.message || 'Payment initiation failed', data: result.data }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: result.data, message: result.message }, { status: 200 });
  } catch (err: any) {
    logger.error('VFD Payment: Error', { error: err.message });
    return NextResponse.json({ ok: false, message: err.message || 'Payment initiation failed' }, { status: 500 });
  }
}
