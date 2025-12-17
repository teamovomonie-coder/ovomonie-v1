/**
 * VFD Wallet API Route - Add Money via Bank Transfer
 * This API provides bank transfer details for users to fund their wallet
 * 
 * Flow:
 * 1. User initiates "Add Money" via Bank Transfer
 * 2. We provide our VFD pool account details for transfer
 * 3. User makes transfer from their bank
 * 4. VFD sends webhook notification when funds arrive
 * 5. We credit user's wallet balance
 */

import { NextRequest, NextResponse } from 'next/server';
import vfdWallet from '@/lib/vfd-wallet';

export async function GET(request: NextRequest) {
  try {
    // Get pool account details for bank transfer
    const result = await vfdWallet.getAccountEnquiry();

    if (!result.ok || !result.data) {
      return NextResponse.json(
        { error: 'Unable to get transfer details', details: result.message },
        { status: 500 }
      );
    }

    // Return bank transfer details
    return NextResponse.json({
      success: true,
      data: {
        bankName: 'VFD Microfinance Bank',
        accountNumber: result.data.accountNo,
        accountName: result.data.client,
        // Generate unique reference for tracking
        reference: `OVO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        instructions: [
          'Transfer the exact amount you want to add to your wallet',
          'Use the reference number in your transfer narration',
          'Funds will be credited within 5 minutes of confirmation'
        ],
        note: 'Please use online/mobile banking for faster processing'
      }
    });
  } catch (error) {
    console.error('Error getting bank transfer details:', error);
    return NextResponse.json(
      { error: 'Failed to get transfer details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, reference } = body;

    if (!userId || !amount || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, reference' },
        { status: 400 }
      );
    }

    // Get pool account for transfer
    const accountResult = await vfdWallet.getAccountEnquiry();

    if (!accountResult.ok || !accountResult.data) {
      return NextResponse.json(
        { error: 'Unable to initialize transfer', details: accountResult.message },
        { status: 500 }
      );
    }

    // Store pending transfer record (to be matched with webhook)
    // This would typically be stored in database
    const transferRecord = {
      userId,
      amount: parseFloat(amount),
      reference,
      accountNumber: accountResult.data.accountNo,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // TODO: Save to database
    // await db.pendingTransfers.create({ data: transferRecord });

    return NextResponse.json({
      success: true,
      data: {
        transferId: reference,
        bankName: 'VFD Microfinance Bank',
        accountNumber: accountResult.data.accountNo,
        accountName: accountResult.data.client,
        amount: parseFloat(amount),
        reference,
        status: 'awaiting_transfer',
        expiresAt: transferRecord.expiresAt,
        instructions: `Transfer ₦${parseFloat(amount).toLocaleString()} to ${accountResult.data.accountNo} (VFD Bank)`
      }
    });
  } catch (error) {
    console.error('Error creating bank transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    );
  }
}
