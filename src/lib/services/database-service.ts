import { 
  getUserById, 
  getUserByPhone, 
  getUserByAccountNumber,
  updateUserBalance,
  createTransaction,
  createNotification,
  transactionExists,
  getTodayDebitTotal,
  getTodayCreditTotal,
  DbUser,
  DbTransaction,
  DbNotification
} from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Centralized Database Service Layer
 * All database operations go through Supabase as primary DB
 * Firebase is used only as backup (handled internally in db.ts)
 */
export class DatabaseService {
  
  // User Operations
  static async getUser(identifier: string, type: 'id' | 'phone' | 'account'): Promise<DbUser | null> {
    try {
      switch (type) {
        case 'id':
          return await getUserById(identifier);
        case 'phone':
          return await getUserByPhone(identifier);
        case 'account':
          return await getUserByAccountNumber(identifier);
        default:
          throw new Error('Invalid identifier type');
      }
    } catch (error) {
      logger.error(`Error getting user by ${type}:`, error);
      return null;
    }
  }

  static async updateBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      return await updateUserBalance(userId, newBalance);
    } catch (error) {
      logger.error('Error updating balance:', error);
      return false;
    }
  }

  // Transaction Operations
  static async recordTransaction(transaction: DbTransaction): Promise<string | null> {
    try {
      // Check for duplicate transactions
      if (await transactionExists(transaction.reference)) {
        logger.warn('Duplicate transaction attempt:', transaction.reference);
        return null;
      }

      return await createTransaction(transaction);
    } catch (error) {
      logger.error('Error recording transaction:', error);
      return null;
    }
  }

  static async checkDailyLimits(userId: string): Promise<{ debitTotal: number; creditTotal: number }> {
    try {
      const [debitTotal, creditTotal] = await Promise.all([
        getTodayDebitTotal(userId),
        getTodayCreditTotal(userId)
      ]);
      
      return { debitTotal, creditTotal };
    } catch (error) {
      logger.error('Error checking daily limits:', error);
      return { debitTotal: 0, creditTotal: 0 };
    }
  }

  // Notification Operations
  static async sendNotification(notification: DbNotification): Promise<boolean> {
    try {
      const notificationId = await createNotification(notification);
      return notificationId !== null;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  // Transaction with Balance Update (Atomic Operation)
  static async processTransfer(
    senderId: string,
    recipientId: string,
    amount: number,
    reference: string,
    narration: string,
    senderName: string,
    recipientName: string
  ): Promise<{ success: boolean; newSenderBalance?: number; error?: string }> {
    try {
      // Get current balances
      const [sender, recipient] = await Promise.all([
        this.getUser(senderId, 'id'),
        this.getUser(recipientId, 'id')
      ]);

      if (!sender || !recipient) {
        return { success: false, error: 'User not found' };
      }

      // Check sufficient balance
      if (sender.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Calculate new balances
      const newSenderBalance = sender.balance - amount;
      const newRecipientBalance = recipient.balance + amount;

      // Update balances
      const [senderUpdate, recipientUpdate] = await Promise.all([
        this.updateBalance(senderId, newSenderBalance),
        this.updateBalance(recipientId, newRecipientBalance)
      ]);

      if (!senderUpdate || !recipientUpdate) {
        return { success: false, error: 'Failed to update balances' };
      }

      // Record transactions
      const [debitTxn, creditTxn] = await Promise.all([
        this.recordTransaction({
          user_id: senderId,
          category: 'transfer',
          type: 'debit',
          amount,
          reference: `${reference}-debit`,
          narration: narration || `Transfer to ${recipientName}`,
          party_name: recipientName,
          party_account: recipient.account_number,
          balance_after: newSenderBalance
        }),
        this.recordTransaction({
          user_id: recipientId,
          category: 'transfer',
          type: 'credit',
          amount,
          reference: `${reference}-credit`,
          narration: narration || `Transfer from ${senderName}`,
          party_name: senderName,
          party_account: sender.account_number,
          balance_after: newRecipientBalance
        })
      ]);

      if (!debitTxn || !creditTxn) {
        logger.error('Failed to record transaction history');
      }

      return { success: true, newSenderBalance };
    } catch (error) {
      logger.error('Error processing transfer:', error);
      return { success: false, error: 'Transfer processing failed' };
    }
  }
}