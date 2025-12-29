import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { z } from 'zod';

const imageMatchSchema = z.object({
  selfieImage: z.string().min(1, 'Selfie image is required'),
  bvnPhoto: z.string().min(1, 'BVN photo is required'),
});

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = imageMatchSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Invalid image data',
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { selfieImage, bvnPhoto } = validation.data;

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    try {
      // Use VFD image match verification
      const imageMatchResult = await vfdWalletService.verifyImageMatch({
        accountNumber: user.account_number || 'DEV-ACCOUNT',
        selfieImage: selfieImage.replace(/^data:image\/\w+;base64,/, ''),
        idCardImage: bvnPhoto.replace(/^data:image\/\w+;base64,/, ''),
      });

      const isMatch = imageMatchResult.match && imageMatchResult.confidence >= 70;

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            selfie_verified: isMatch,
            selfie_match_score: imageMatchResult.confidence,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          logger.error('Failed to update selfie verification status', { userId, error });
        }
      }

      logger.info('Image match completed', { userId, confidence: imageMatchResult.confidence, isMatch });

      return NextResponse.json({
        ok: true,
        message: isMatch ? 'Face verification successful' : 'Face verification failed',
        data: {
          isMatch,
          matchScore: imageMatchResult.confidence,
          confidence: imageMatchResult.confidence,
        },
      });

    } catch (vfdError) {
      logger.error('VFD image match failed', { userId, error: vfdError });
      return NextResponse.json({ 
        ok: false, 
        message: 'Image verification service is currently unavailable. Please try again later.' 
      }, { status: 503 });
    }

  } catch (error) {
    logger.error('Image match error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
