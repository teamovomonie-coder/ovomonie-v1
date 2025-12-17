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
    
    // Mock VFD response for testing (replace with real VFD call when credentials are activated)
    const vfdResult = {
      status: '00',
      accountNumber: `90${Math.floor(Math.random() * 100000000)}`, // Mock account number
      message: 'Virtual account created successfully'
    };

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