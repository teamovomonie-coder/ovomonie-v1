import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { getWalletBalance } from '@/lib/virtual-accounts';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let balance = await getWalletBalance(userId);
    
    // Fallback: fetch directly from Supabase if helper fails
    if (!balance || balance.balance === 0) {
      const { supabaseAdmin } = await import('@/lib/supabase');
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', userId)
          .maybeSingle();
        
        if (data) {
          balance = {
            userId,
            balance: data.balance || 0,
            ledgerBalance: data.balance || 0,
            lastUpdated: new Date().toISOString()
          };
        }
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      balanceInKobo: balance?.balance || 0,
      data: balance || { userId, balance: 0, ledgerBalance: 0, lastUpdated: new Date().toISOString() }
    });

  } catch (error) {
    logger.error('Wallet balance fetch error', { error });
    return NextResponse.json(
      { 
        ok: true,
        success: true,
        balanceInKobo: 0,
        error: 'Failed to fetch balance',
        data: { balance: 0, ledgerBalance: 0 }
      },
      { status: 200 }
    );
  }
}