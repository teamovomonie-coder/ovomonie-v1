/**
 * VFD Inward Credit Webhook Handler
 * This receives notifications when funds are credited to our VFD account
 * 
 * Documentation: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/wallets-api/#50-inward-credit-notification
 * 
 * Webhook Payload:
 * {
 *   "reference": "uniquevalue-(Randomly generated value)",
 *   "amount": "1000",
 *   "account_number": "1010123498",
 *   "originator_account_number": "2910292882",
 *   "originator_account_name": "AZUBUIKE MUSA DELE",
 *   "originator_bank": "000004",
 *   "originator_narration": "test",
 *   "timestamp": "2021-01-11T09:34:55.879Z",
 *   "transaction_channel": "EFT",
 *   "session_id": "00001111222233334455"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

// Interface for VFD webhook payload
interface VFDCreditNotification {
  reference: string;
  amount: string;
  account_number: string;
  originator_account_number: string;
  originator_account_name: string;
  originator_bank: string;
  originator_narration: string;
  timestamp: string;
  transaction_channel: string;
  session_id: string;
  initialCreditRequest?: boolean; // For initial inward credit notifications
}

// Whitelist of allowed VFD IP addresses (configure based on VFD documentation)
const VFD_WHITELIST_IPS = [
  // Add VFD server IPs here when provided
];

export async function POST(request: NextRequest) {
  try {
    // Optional: IP whitelisting for security
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') ||
                     'unknown';
    
    // Log incoming webhook for debugging
    console.log('[VFD Webhook] Received credit notification from IP:', clientIP);

    // Parse webhook payload
    const payload: VFDCreditNotification = await request.json();
    
    console.log('[VFD Webhook] Payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.reference || !payload.amount || !payload.account_number) {
      console.error('[VFD Webhook] Invalid payload - missing required fields');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Check if this is an initial credit request (funds may not have settled)
    if (payload.initialCreditRequest === true) {
      console.log('[VFD Webhook] Initial credit notification - waiting for final settlement');
      // Don't credit user yet, just acknowledge
      return NextResponse.json({ status: 'ok', message: 'Initial notification received' });
    }

    // Process the credit notification
    const creditDetails = {
      reference: payload.reference,
      amount: parseFloat(payload.amount),
      accountNumber: payload.account_number,
      senderAccount: payload.originator_account_number,
      senderName: payload.originator_account_name,
      senderBank: payload.originator_bank,
      narration: payload.originator_narration,
      timestamp: payload.timestamp,
      channel: payload.transaction_channel,
      sessionId: payload.session_id
    };

    console.log('[VFD Webhook] Processing credit:', creditDetails);

    // TODO: Implement actual credit logic
    // 1. Look up pending transfer by reference or sender details
    // 2. Match amount with pending transfer
    // 3. Credit user's wallet balance
    // 4. Update transaction status
    // 5. Send notification to user

    // Example implementation:
    // const pendingTransfer = await db.pendingTransfers.findFirst({
    //   where: {
    //     OR: [
    //       { reference: payload.originator_narration },
    //       { amount: parseFloat(payload.amount) }
    //     ],
    //     status: 'pending'
    //   }
    // });
    //
    // if (pendingTransfer) {
    //   await db.wallets.update({
    //     where: { userId: pendingTransfer.userId },
    //     data: { balance: { increment: parseFloat(payload.amount) } }
    //   });
    //   
    //   await db.transactions.create({
    //     data: {
    //       userId: pendingTransfer.userId,
    //       type: 'credit',
    //       amount: parseFloat(payload.amount),
    //       reference: payload.reference,
    //       description: `Bank transfer from ${payload.originator_account_name}`,
    //       status: 'completed'
    //     }
    //   });
    // }

    // Must respond with 200 status to acknowledge webhook
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Credit notification processed',
      reference: payload.reference
    });

  } catch (error) {
    console.error('[VFD Webhook] Error processing notification:', error);
    // Still return 200 to prevent VFD from retrying
    // Log error for investigation
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error processing notification'
    });
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'VFD webhook endpoint active'
  });
}
