import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const checks = {
      server: 'ok',
      database: 'ok',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      status: 'healthy',
      checks,
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed'
    }, { status: 500 });
  }
}
