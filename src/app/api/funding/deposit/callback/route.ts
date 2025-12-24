import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { userService, transactionService, notificationService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');

    logger.info('Deposit callback received', { reference, status, amount });

    if (!reference) {
      return NextResponse.redirect(new URL('/add-money?error=invalid_callback', request.url));
    }

    if (status !== 'success') {
      return NextResponse.redirect(new URL(`/add-money?error=payment_failed&reference=${reference}`, request.url));
    }

    // Find transaction by reference
    const txn = await transactionService.getByReference(reference);
    
    if (txn) {
      // Already processed
      return NextResponse.redirect(new URL(`/success?reference=${reference}`, request.url));
    }

    // Extract user ID from reference (format: userId-timestamp)
    const userId = reference.split('-')[0];
    
    if (!userId) {
      return NextResponse.redirect(new URL('/add-money?error=invalid_reference', request.url));
    }

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.redirect(new URL('/add-money?error=user_not_found', request.url));
    }

    const amountKobo = amount ? parseInt(amount) : 0;
    const newBalance = user.balance + amountKobo;

    // Update balance
    await userService.updateBalance(userId, newBalance);

    // Log transaction
    await transactionService.create({
      user_id: userId,
      reference,
      type: 'credit',
      category: 'funding',
      amount: amountKobo,
      narration: 'Account funding via VFD payment widget',
      party_name: 'VFD',
      balance_after: newBalance,
    });

    // Create notification
    await notificationService.create({
      user_id: userId,
      title: 'Deposit Successful',
      body: `Your account has been credited with ₦${(amountKobo / 100).toLocaleString()}.`,
      category: 'funding',
      reference,
    });

    logger.info('Deposit processed successfully', { userId, reference, amount: amountKobo });

    return NextResponse.redirect(new URL(`/success?reference=${reference}&amount=${amountKobo}`, request.url));

  } catch (error) {
    logger.error('Deposit callback error:', error);
    return NextResponse.redirect(new URL('/add-money?error=processing_failed', request.url));
  }
}
