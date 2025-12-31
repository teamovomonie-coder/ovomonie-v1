import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        ok: false, 
        message: 'enabled must be a boolean' 
      }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Database not configured' 
      }, { status: 500 });
    }

    // Update device fingerprinting setting
    const { error } = await supabaseAdmin
      .from('users')
      .update({ device_fingerprinting_enabled: enabled })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to update device fingerprinting setting', { error, userId });
      return NextResponse.json({ 
        ok: false, 
        message: 'Failed to update setting' 
      }, { status: 500 });
    }

    logger.info('Device fingerprinting setting updated', { userId, enabled });

    return NextResponse.json({
      ok: true,
      message: 'Device fingerprinting setting updated successfully',
      enabled
    });

  } catch (error: any) {
    logger.error('Update device fingerprinting setting error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

