import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Service unavailable' }, { status: 503 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, kyc_tier, bvn_verified, selfie_verified, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch user tier', { userId, error });
      return NextResponse.json({ ok: false, message: 'Failed to fetch user data' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        userId: user.id,
        kycTier: user.kyc_tier,
        bvnVerified: user.bvn_verified,
        selfieVerified: user.selfie_verified,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    logger.error('Debug tier check error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}