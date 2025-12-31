import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { apiUnauthorized, apiError, apiSuccess } from '@/lib/middleware/api-response';

export async function GET(request: NextRequest) {
  try {
<<<<<<< HEAD
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiUnauthorized();
    }

    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return apiUnauthorized();
    }
=======
    const userId = getUserIdFromToken(request.headers) || 'dev-user-fallback';
    
    let balance = await getWalletBalance(userId);
>>>>>>> 2df66c9c09cc07b6cf12ffa753372777fb2cf6b2

    if (!supabaseAdmin) {
      return apiError('Database error');
    }

    // Add timeout protection (3 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    const userData = await Promise.race([
      supabaseAdmin
        .from('users')
        .select('id, balance, status')
        .eq('id', userId)
        .single(),
      timeoutPromise
    ]).catch(err => {
      logger.warn('Database query timeout or error', { userId, error: err.message });
      return { data: null, error: err };
    });

    if (!userData || !userData.data) {
      // Return default balance instead of error
      return apiSuccess({
        balanceInKobo: 0,
        data: {
          userId,
          balance: 0,
          ledgerBalance: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    if (userData.data.status?.toUpperCase() !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account not active', ok: false }, { status: 403 });
    }

    const balance = userData.data.balance || 0;

    return apiSuccess({
      balanceInKobo: balance,
      data: {
        userId,
        balance,
        ledgerBalance: balance,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
<<<<<<< HEAD
    logger.error('Wallet balance error:', error);
    // Return default balance instead of error
    return apiSuccess({
      balanceInKobo: 0,
      data: {
        userId: 'unknown',
        balance: 0,
        ledgerBalance: 0,
        lastUpdated: new Date().toISOString()
      }
    });
=======
    logger.error('Wallet balance error', { error, userId: getUserIdFromToken(request.headers) });
    return NextResponse.json(
      { 
        ok: false,
        success: false,
        error: 'Failed to fetch balance'
      },
      { status: 500 }
    );
>>>>>>> 2df66c9c09cc07b6cf12ffa753372777fb2cf6b2
  }
}
