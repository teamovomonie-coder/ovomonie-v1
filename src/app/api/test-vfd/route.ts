import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test VFD API connection
    const response = await fetch(`${process.env.VFD_WALLET_API_BASE}/account/enquiry`, {
      headers: {
        'AccessToken': process.env.VFD_ACCESS_TOKEN || '',
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      vfdResponse: result,
      hasToken: !!process.env.VFD_ACCESS_TOKEN,
      baseUrl: process.env.VFD_WALLET_API_BASE
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}