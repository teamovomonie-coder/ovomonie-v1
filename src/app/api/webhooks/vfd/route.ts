import { NextRequest, NextResponse } from 'next/server';
import { processInboundTransfer } from '@/lib/virtual-accounts';
import { logger } from '@/lib/logger';

/**
 * VFD Webhook Handler
 * Processes inbound bank transfers to virtual accounts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info('VFD webhook received', { body });

    // Validate webhook payload
    const {
      accountNumber,
      amount,
      senderName,
      senderAccount,
      senderBank,
      reference,
      sessionId,
      transactionType
    } = body;

    if (!accountNumber || !amount || !reference) {
      logger.error('Invalid webhook payload', { body });
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Only process credit transactions
    if (transactionType !== 'CREDIT') {
      logger.info('Ignoring non-credit transaction', { transactionType, reference });
      return NextResponse.json({ status: 'ignored' });
    }

    // Process the inbound transfer
    const result = await processInboundTransfer({
      accountNumber,
      amount,
      senderName: senderName || 'Unknown',
      senderAccount: senderAccount || '',
      senderBank: senderBank || '',
      reference,
      sessionId: sessionId || ''
    });

    if (!result.success) {
      logger.error('Failed to process inbound transfer', { 
        error: result.error, 
        reference 
      });
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    logger.info('Inbound transfer processed successfully', { reference });
    return NextResponse.json({ status: 'success' });

  } catch (error) {
    logger.error('VFD webhook error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'VFD webhook endpoint active' });
}