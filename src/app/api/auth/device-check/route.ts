import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

// Helper functions to detect device info from user agent
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }
  return 'Desktop';
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Unknown Browser';
}

function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os') || ua.includes('macos')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Unknown OS';
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { deviceFingerprint, selfieImage, deviceMetadata } = await req.json();
    
    // Extract device metadata from request if provided, otherwise use defaults
    const deviceInfo = deviceMetadata || {
      device_name: req.headers.get('user-agent')?.substring(0, 50) || 'Unknown Device',
      device_type: detectDeviceType(req.headers.get('user-agent') || ''),
      browser: detectBrowser(req.headers.get('user-agent') || ''),
      os: detectOS(req.headers.get('user-agent') || ''),
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                  req.headers.get('x-real-ip') || 
                  'Unknown',
      location: 'Unknown' // Could be enhanced with IP geolocation
    };

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

    // Check if device fingerprinting is enabled
    const deviceFingerprintingEnabled = user.device_fingerprinting_enabled ?? true; // Default enabled
    
    // If device fingerprinting is disabled, trust device without verification
    if (!deviceFingerprintingEnabled) {
      // Trust device without liveness check
      await supabaseAdmin
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_trusted: true,
          last_used: new Date().toISOString(),
          device_name: deviceInfo.device_name,
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip_address: deviceInfo.ip_address,
          location: deviceInfo.location
        });

      return NextResponse.json({ 
        ok: true, 
        requiresLiveness: false,
        message: 'Device trusted (fingerprinting disabled)' 
      });
    }

    // Check if user has liveness check enabled (for backward compatibility)
    const livenessEnabled = user.liveness_check_enabled ?? true; // Default enabled

    if (!livenessEnabled) {
      // Trust device without liveness check
      await supabaseAdmin
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_trusted: true,
          last_used: new Date().toISOString(),
          device_name: deviceInfo.device_name,
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip_address: deviceInfo.ip_address,
          location: deviceInfo.location
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

    // Perform liveness check using VFD API
    try {
      // Remove data URL prefix if present
      const base64Image = selfieImage.replace(/^data:image\/\w+;base64,/, '');
      
      const livenessResult = await vfdWalletService.verifyLiveness({
        base64Image
      });

      // VFD API: probability > 0.5 means "live"
      if (!livenessResult.isLive) {
        logger.warn('Liveness check failed', { 
          userId, 
          probability: livenessResult.probability,
          quality: livenessResult.quality
        });
        
        return NextResponse.json({
          ok: false,
          message: `Liveness verification failed. Please ensure you're in a well-lit area and your face is clearly visible.`,
          data: {
            probability: livenessResult.probability,
            quality: livenessResult.quality
          }
        }, { status: 400 });
      }

      // Additional quality check: ensure image quality is acceptable
      if (livenessResult.quality < 0.3) {
        logger.warn('Liveness check passed but low quality', { 
          userId, 
          quality: livenessResult.quality 
        });
        // Still allow but log warning
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
          liveness_score: livenessResult.probability * 100, // Store as 0-100 scale
          device_name: deviceInfo.device_name,
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip_address: deviceInfo.ip_address,
          location: deviceInfo.location
        });

      logger.info('New device verified with liveness check', { 
        userId, 
        deviceFingerprint,
        probability: livenessResult.probability,
        quality: livenessResult.quality,
        confidence: livenessResult.confidence 
      });

      return NextResponse.json({
        ok: true,
        requiresLiveness: false,
        message: 'Device verified successfully',
        data: { 
          probability: livenessResult.probability,
          quality: livenessResult.quality,
          confidence: livenessResult.confidence 
        }
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