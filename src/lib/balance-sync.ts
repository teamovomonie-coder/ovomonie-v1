/**
 * Balance Sync Service
 * Syncs frontend balance with VFD wallet balance
 */

import { vfdWalletService } from './vfd-wallet-service';
import { userService } from './db';
import { logger } from './logger';

/**
 * Sync user balance with VFD wallet
 * Returns the synced balance in kobo
 */
export async function syncBalanceWithVFD(userId: string, accountNumber: string): Promise<number> {
  try {
    // Skip in dev mode
    if (process.env.NODE_ENV !== 'production') {
      const user = await userService.getById(userId);
      return user?.balance ?? 0;
    }

    // Get VFD wallet balance
    const vfdBalance = await vfdWalletService.getBalance(accountNumber);
    const vfdBalanceInKobo = Math.round(parseFloat(vfdBalance) * 100);

    // Update local balance to match VFD
    await userService.updateBalance(userId, vfdBalanceInKobo);

    logger.info('Balance synced with VFD', { userId, vfdBalanceInKobo });
    return vfdBalanceInKobo;
  } catch (error) {
    logger.error('Balance sync failed', { error, userId });
    // Return current balance if sync fails
    const user = await userService.getById(userId);
    return user?.balance ?? 0;
  }
}

/**
 * Execute transaction with VFD and update local balance
 */
export async function executeVFDTransaction(
  userId: string,
  accountNumber: string,
  transactionFn: () => Promise<void>,
  amountInKobo: number,
  type: 'credit' | 'debit'
): Promise<number> {
  const user = await userService.getById(userId);
  if (!user) throw new Error('User not found');

  // Calculate new balance
  const newBalance = type === 'credit'
    ? (user.balance || 0) + amountInKobo
    : (user.balance || 0) - amountInKobo;

  // Execute VFD transaction (skip in dev)
  if (process.env.NODE_ENV === 'production') {
    await transactionFn();
  }

  // Update local balance
  await userService.updateBalance(userId, newBalance);

  return newBalance;
}
