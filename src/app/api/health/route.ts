import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  const checks = {
    server: 'ok',
    database: 'unknown',
    timestamp: new Date().toISOString(),
  };

  // Check database connection
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)
        .single();
      
      checks.database = error && error.code !== 'PGRST116' ? 'error' : 'ok';
    } else {
      checks.database = 'unavailable';
    }
  } catch (error) {
    logger.error('Health check database error', { error });
    checks.database = 'error';
  }

  const isHealthy = checks.server === 'ok' && checks.database === 'ok';
  const status = isHealthy ? 200 : 503;

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    uptime: process.uptime(),
  }, { status });
}
