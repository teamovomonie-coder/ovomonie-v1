import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { deviceFingerprint, selfieImage } = await req.json();

    if (!deviceFingerprint) {
      return NextResponse.json({ ok: false, message: 'Device fingerprint required' }, { status: 400 });
    }

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    // Check if device is known
    const { data: knownDevice } = await supabaseAdmin
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_trusted', true)
      .single();

    if (knownDevice) {
      return NextResponse.json({ 
        ok: true, 
        requiresLiveness: false,
        message: 'Known device' 
      });
    }

    // Check if user has liveness check enabled
    const livenessEnabled = user.liveness_check_enabled ?? true; // Default enabled

    if (!livenessEnabled) {
      // Trust device without liveness check
      await supabaseAdmin
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_trusted: true,
          last_used: new Date().toISOString()
        });

      return NextResponse.json({ 
        ok: true, 
        requiresLiveness: false,
        message: 'Device trusted (liveness disabled)' 
      });
    }

    // New device + liveness enabled = require liveness check
    if (!selfieImage) {
      return NextResponse.json({ 
        ok: true, 
        requiresLiveness: true,
        message: 'New device detected. Liveness check required.' 
      });
    }

    // Perform liveness check
    try {
      const livenessResult = await vfdWalletService.verifyLiveness({
        accountNumber: user.account_number || 'DEV-ACCOUNT',
        videoFrames: [selfieImage.replace(/^data:image\/\w+;base64,/, '')]
      });

      if (!livenessResult.isLive || livenessResult.confidence < 50) {
        return NextResponse.json({
          ok: false,
          message: `Liveness check failed. Confidence: ${livenessResult.confidence.toFixed(1)}%`
        }, { status: 400 });
      }

      // Trust the device
      await supabaseAdmin
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_trusted: true,
          last_used: new Date().toISOString(),
          liveness_verified: true,
          liveness_score: livenessResult.confidence
        });

      logger.info('New device verified with liveness check', { 
        userId, 
        deviceFingerprint,
        confidence: livenessResult.confidence 
      });

      return NextResponse.json({
        ok: true,
        requiresLiveness: false,
        message: 'Device verified successfully',
        data: { confidence: livenessResult.confidence }
      });

    } catch (error) {
      logger.error('Liveness check failed for new device', { error, userId });
      return NextResponse.json({
        ok: false,
        message: 'Liveness verification failed. Please try again.'
      }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('Device check error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: 'Device verification failed' },
      { status: 500 }
    );
  }
}