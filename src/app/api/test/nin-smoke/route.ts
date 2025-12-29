import { NextRequest, NextResponse } from 'next/server';
import { getVFDHeaders } from '@/lib/vfd-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const headers = await getVFDHeaders();
    const ninBaseUrl = process.env.VFD_KYC_NIN_API_BASE;
    
    if (!ninBaseUrl) {
      return NextResponse.json({
        ok: false,
        message: 'VFD_KYC_NIN_API_BASE not configured'
      });
    }

    logger.info('NIN API smoke test starting', { endpoint: `${ninBaseUrl}/verify-nin` });

    const response = await fetch(`${ninBaseUrl}/verify-nin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nin: '12345678901' // Test NIN
      }),
    });

    const responseText = await response.text();
    
    logger.info('NIN API smoke test response', {
      status: response.status,
      statusText: response.statusText,
      hasContent: !!responseText.trim(),
      contentLength: responseText.length
    });

    return NextResponse.json({
      ok: true,
      test: 'NIN API Connection Test',
      endpoint: `${ninBaseUrl}/verify-nin`,
      status: response.status,
      statusText: response.statusText,
      hasContent: !!responseText.trim(),
      contentLength: responseText.length,
      response: responseText.substring(0, 500) // First 500 chars
    });

  } catch (error) {
    logger.error('NIN API smoke test failed', { error });
    return NextResponse.json({
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}