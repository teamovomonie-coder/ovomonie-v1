/**
 * Debit Card Management API
 * Handles card creation, listing, blocking, and transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { vfdDebitCardService } from '@/lib/vfd-debitcard-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { action, cardType, deliveryAddress, cardId, reason, oldPIN, newPIN, startDate, endDate, limit } = await req.json();

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (!user.accountNumber) {
      return NextResponse.json({ ok: false, message: 'Account number not found' }, { status: 400 });
    }

    switch (action) {
      case 'create':
        if (!cardType || !['PHYSICAL', 'VIRTUAL'].includes(cardType)) {
          return NextResponse.json({ ok: false, message: 'Valid cardType required (PHYSICAL or VIRTUAL)' }, { status: 400 });
        }
        const card = await vfdDebitCardService.createCard({
          accountNumber: user.accountNumber,
          cardType,
          deliveryAddress,
        });
        return NextResponse.json({ ok: true, data: card });

      case 'list':
        const cards = await vfdDebitCardService.getAccountCards(user.accountNumber);
        return NextResponse.json({ ok: true, data: cards });

      case 'details':
        if (!cardId) {
          return NextResponse.json({ ok: false, message: 'cardId is required' }, { status: 400 });
        }
        const details = await vfdDebitCardService.getCardDetails(cardId);
        return NextResponse.json({ ok: true, data: details });

      case 'block':
        if (!cardId || !reason) {
          return NextResponse.json({ ok: false, message: 'cardId and reason are required' }, { status: 400 });
        }
        await vfdDebitCardService.blockCard(cardId, reason);
        return NextResponse.json({ ok: true, message: 'Card blocked successfully' });

      case 'unblock':
        if (!cardId) {
          return NextResponse.json({ ok: false, message: 'cardId is required' }, { status: 400 });
        }
        await vfdDebitCardService.unblockCard(cardId);
        return NextResponse.json({ ok: true, message: 'Card unblocked successfully' });

      case 'transactions':
        if (!cardId) {
          return NextResponse.json({ ok: false, message: 'cardId is required' }, { status: 400 });
        }
        const transactions = await vfdDebitCardService.getCardTransactions({
          cardId,
          startDate,
          endDate,
          limit,
        });
        return NextResponse.json({ ok: true, data: transactions });

      case 'change-pin':
        if (!cardId || !oldPIN || !newPIN) {
          return NextResponse.json({ ok: false, message: 'cardId, oldPIN, and newPIN are required' }, { status: 400 });
        }
        await vfdDebitCardService.changeCardPIN(cardId, oldPIN, newPIN);
        return NextResponse.json({ ok: true, message: 'PIN changed successfully' });

      default:
        return NextResponse.json({ ok: false, message: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Debit card operation error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'Card operation failed' },
      { status: 500 }
    );
  }
}
