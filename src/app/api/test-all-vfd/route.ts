import { NextResponse } from 'next/server';
import { vfdAPI } from '@/lib/vfd-api';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  // Test Cards API
  try {
    const cardTest = await vfdAPI.cards.initiate({
      amount: '100',
      reference: `test_${Date.now()}`,
      cardNumber: '5061460410120223344',
      cardPin: '1234',
      cvv2: '123',
      expiryDate: '5003'
    });
    results.tests.push({
      service: 'Cards API',
      endpoint: 'initiate',
      status: cardTest.ok ? 'PASS' : 'FAIL',
      message: cardTest.data?.message || 'No message'
    });
  } catch (error) {
    results.tests.push({
      service: 'Cards API',
      endpoint: 'initiate',
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test Wallet API
  try {
    const walletTest = await vfdAPI.wallet.getAccount();
    results.tests.push({
      service: 'Wallet API',
      endpoint: 'getAccount',
      status: walletTest.ok ? 'PASS' : 'FAIL',
      message: walletTest.data?.message || 'No message'
    });
  } catch (error) {
    results.tests.push({
      service: 'Wallet API',
      endpoint: 'getAccount',
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const totalCount = results.tests.length;

  return NextResponse.json({
    success: passCount === totalCount,
    summary: `${passCount}/${totalCount} tests passed`,
    results
  });
}