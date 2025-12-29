import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const bvnSchema = z.object({
  bvn: z.string().length(11, 'BVN must be 11 digits'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = bvnSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Invalid BVN data',
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { bvn, firstName, lastName, dateOfBirth } = validation.data;

    const vfdResponse = await fetch(
      `${process.env.VFD_KYC_AML_API_BASE}/kyc/bvn`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AccessToken': process.env.VFD_ACCESS_TOKEN || '',
        },
        body: JSON.stringify({
          bvn,
          firstName,
          lastName,
          dateOfBirth,
        }),
      }
    );

    const vfdData = await vfdResponse.json();

    if (!vfdResponse.ok || !vfdData.success) {
      logger.error('VFD BVN verification failed', { userId, vfdData });
      return NextResponse.json({ 
        ok: false, 
        message: vfdData.message || 'BVN verification failed' 
      }, { status: 400 });
    }

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          bvn_verified: true,
          bvn_data: vfdData.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        logger.error('Failed to update BVN verification status', { userId, error });
      }
    }

    logger.info('BVN verified successfully', { userId });

    return NextResponse.json({
      ok: true,
      message: 'BVN verified successfully',
      data: {
        firstName: vfdData.data?.firstName,
        lastName: vfdData.data?.lastName,
        dateOfBirth: vfdData.data?.dateOfBirth,
        phoneNumber: vfdData.data?.phoneNumber,
      },
    });

  } catch (error) {
    logger.error('BVN verification error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
