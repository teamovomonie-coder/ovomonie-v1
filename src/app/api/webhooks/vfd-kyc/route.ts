import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    logger.info('VFD KYC webhook received', { 
      headers: Object.fromEntries(req.headers.entries()),
      body 
    });

    // Handle different KYC webhook events
    const { event, data } = body;
    
    switch (event) {
      case 'kyc.nin.completed':
        logger.info('NIN verification completed via webhook', { 
          nin: data.nin,
          status: data.status,
          customerData: data.customer 
        });
        break;
        
      case 'kyc.bvn.completed':
        logger.info('BVN verification completed via webhook', { 
          bvn: data.bvn,
          status: data.status,
          customerData: data.customer 
        });
        break;
        
      case 'kyc.consent.granted':
        logger.info('KYC consent granted via webhook', { 
          customerId: data.customerId,
          consentType: data.consentType 
        });
        break;
        
      default:
        logger.info('Unknown KYC webhook event', { event, data });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    logger.error('VFD KYC webhook error', { error });
    return NextResponse.json({ 
      ok: false, 
      message: 'Webhook processing failed' 
    }, { status: 500 });
  }
}