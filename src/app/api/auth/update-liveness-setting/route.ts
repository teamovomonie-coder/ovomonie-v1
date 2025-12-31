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

    const { livenessEnabled } = await req.json();

    if (typeof livenessEnabled !== 'boolean') {
      return NextResponse.json({ 
        ok: false, 
        message: 'livenessEnabled must be a boolean' 
      }, { status: 400 });
    }

    // Update user setting in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ liveness_check_enabled: livenessEnabled })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to update liveness setting', { error, userId });
      return NextResponse.json({ 
        ok: false, 
        message: 'Failed to update setting' 
      }, { status: 500 });
    }

    logger.info('Liveness setting updated', { userId, livenessEnabled });

    return NextResponse.json({
      ok: true,
      message: 'Liveness check setting updated successfully'
    });

  } catch (error: any) {
    logger.error('Update liveness setting error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: 'Failed to update setting' },
      { status: 500 }
    );
  }
}