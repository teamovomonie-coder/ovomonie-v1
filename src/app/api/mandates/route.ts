import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { vfdMandateService } from '@/lib/vfd-mandate-service';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mandateId = searchParams.get('mandateId');

    if (mandateId) {
      const mandate = await vfdMandateService.getMandateDetails(mandateId);
      return NextResponse.json({ ok: true, data: mandate });
    }

    const mandates = await vfdMandateService.getCustomerMandates(userId);
    return NextResponse.json({ ok: true, data: mandates });

  } catch (error) {
    logger.error('Error fetching mandates:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch mandates';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'cancel') {
      const { mandateId, reason } = data;

      if (!mandateId || !reason) {
        return NextResponse.json({ ok: false, message: 'Mandate ID and reason required' }, { status: 400 });
      }

      await vfdMandateService.cancelMandate(mandateId, reason);
      return NextResponse.json({ ok: true, message: 'Mandate cancelled successfully' });
    }

    return NextResponse.json({ ok: false, message: 'Invalid action' }, { status: 400 });

  } catch (error) {
    logger.error('Mandate operation error:', error);
    const message = error instanceof Error ? error.message : 'Operation failed';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
