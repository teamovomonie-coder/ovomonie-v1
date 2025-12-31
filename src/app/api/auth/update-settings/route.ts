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

    const { setting, enabled } = await req.json();

    if (!setting || typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        ok: false, 
        message: 'Setting name and enabled status required' 
      }, { status: 400 });
    }

    // Map of allowed settings to database columns
    const settingsMap: Record<string, string> = {
      'loginAlerts': 'login_alerts_enabled',
      'geoFencing': 'geo_fencing_enabled',
      'internationalTxns': 'international_txns_blocked',
      'bettingPayments': 'betting_payments_restricted',
      'livenessCheck': 'liveness_check_enabled'
    };

    const dbColumn = settingsMap[setting];
    if (!dbColumn) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Invalid setting name' 
      }, { status: 400 });
    }

    // Update user setting in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ [dbColumn]: enabled })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to update user setting', { error, userId, setting });
      return NextResponse.json({ 
        ok: false, 
        message: 'Failed to update setting' 
      }, { status: 500 });
    }

    logger.info('User setting updated', { userId, setting, enabled });

    return NextResponse.json({
      ok: true,
      message: 'Setting updated successfully'
    });

  } catch (error: any) {
    logger.error('Update settings error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: 'Failed to update setting' },
      { status: 500 }
    );
  }
}