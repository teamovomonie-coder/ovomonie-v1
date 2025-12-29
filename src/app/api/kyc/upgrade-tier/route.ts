import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const upgradeSchema = z.object({
  tier: z.number().int().min(2).max(4),
});

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = upgradeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Invalid tier',
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { tier } = validation.data;

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Service unavailable' }, { status: 503 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('kyc_tier, bvn_verified, selfie_verified, phone')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (tier === 2) {
      if (!user.bvn_verified) {
        return NextResponse.json({ 
          ok: false, 
          message: 'BVN verification required' 
        }, { status: 400 });
      }
      if (!user.selfie_verified) {
        return NextResponse.json({ 
          ok: false, 
          message: 'Selfie verification required' 
        }, { status: 400 });
      }

      const { data: otpVerified } = await supabaseAdmin
        .from('otp_verifications')
        .select('verified')
        .eq('user_id', userId)
        .eq('verified', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!otpVerified) {
        return NextResponse.json({ 
          ok: false, 
          message: 'Phone OTP verification required' 
        }, { status: 400 });
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        kyc_tier: tier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to upgrade tier', { userId, tier, updateError });
      return NextResponse.json({ 
        ok: false, 
        message: 'Failed to upgrade account' 
      }, { status: 500 });
    }

    logger.info('KYC tier upgraded successfully', { userId, tier });

    return NextResponse.json({
      ok: true,
      message: `Account upgraded to Tier ${tier} successfully`,
      data: { tier },
    });

  } catch (error) {
    logger.error('Tier upgrade error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
