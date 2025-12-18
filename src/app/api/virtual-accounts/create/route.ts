import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { createUserVirtualAccount } from '@/lib/virtual-accounts';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const txnRef = `VA_${userId}_${Date.now()}`;
    
    // Real VFD API call for virtual account creation
    const vfdResponse = await fetch(`${process.env.VFD_WALLET_API_BASE}/virtualaccount`, {
      method: 'POST',
      headers: {
        'AccessToken': process.env.VFD_ACCESS_TOKEN || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: (amount / 100).toString(),
        merchantName: 'Ovomonie',
        merchantId: userId,
        reference: txnRef,
        validityTime: '4320',
        amountValidation: 'A4'
      })
    });

    const vfdResult = await vfdResponse.json();
    
    if (vfdResult.status !== '00' || !vfdResult.accountNumber) {
      console.error('VFD API error:', vfdResult);
      return NextResponse.json(
        { error: vfdResult.message || 'VFD virtual account creation failed' },
        { status: 500 }
      );
    }

    // Store in Supabase
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('virtual_accounts')
      .insert({
        user_id: userId,
        vfd_account_number: vfdResult.accountNumber,
        reference: txnRef,
        amount: (amount / 100).toString(),
        status: 'active',
        validity_time: '4320',
        merchant_name: 'Ovomonie',
        merchant_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}