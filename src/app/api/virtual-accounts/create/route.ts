import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const txnRef = `VA_${userId}_${Date.now()}`;
    
    // Create mock virtual account for development
    const mockAccount = {
      id: `mock_${txnRef}`,
      userId,
      vfdAccountNumber: `9999${Math.random().toString().slice(2, 8)}`,
      reference: txnRef,
      amount: (amount / 100).toString(),
      status: 'active' as const,
      validityTime: '4320',
      merchantName: 'Ovomonie',
      merchantId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: mockAccount
    });
  } catch (error) {
    console.error('Virtual account creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}