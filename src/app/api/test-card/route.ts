import { NextResponse } from 'next/server';
import { initiateCardPayment } from '@/lib/vfd';

export async function POST() {
  try {
    // Test with mock card data
    const testPayload = {
      amount: 1000, // ₦10.00
      reference: `test_${Date.now()}`,
      cardNumber: '5061460410120223344', // Test Verve card
      cardPin: '1234',
      cvv2: '123',
      expiryDate: '5003', // YYMM format
      shouldTokenize: false,
    };

    console.log('Testing VFD card payment with:', {
      amount: testPayload.amount,
      reference: testPayload.reference,
      cardNumber: `${testPayload.cardNumber.substring(0, 6)}****${testPayload.cardNumber.slice(-4)}`,
    });

    const result = await initiateCardPayment(testPayload);

    return NextResponse.json({
      success: result.ok,
      status: result.status,
      message: result.data?.message || 'Test completed',
      data: result.data
    });
  } catch (error) {
    console.error('VFD test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}