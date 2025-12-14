/**
 * Notification Helper
 * Centralized function to create notifications for all transaction types
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  category: 'transfer' | 'transaction' | 'security' | 'promotion' | 'withdrawal' | 'funding';
  type?: 'debit' | 'credit';
  amount?: number; // in kobo
  reference?: string;
  senderName?: string;
  recipientName?: string;
}

/**
 * Create a single notification in Supabase
 */
export async function createNotification(payload: NotificationPayload): Promise<boolean> {
  if (!supabase) {
    logger.warn('[NotificationHelper] Supabase not configured');
    return false;
  }

  try {
    logger.info('[NotificationHelper] Creating notification:', { userId: payload.userId, title: payload.title });
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        category: payload.category,
        type: payload.type,
        amount: payload.amount,
        reference: payload.reference,
        sender_name: payload.senderName,
        recipient_name: payload.recipientName,
      })
      .select();

    if (error) {
      logger.error('[NotificationHelper] Failed to create notification:', error);
      return false;
    }

    logger.info('[NotificationHelper] Notification created successfully:', { data: data?.[0]?.id });
    return true;
  } catch (err) {
    logger.error('[NotificationHelper] Exception creating notification:', err);
    return false;
  }
}

/**
 * Create multiple notifications at once (e.g., for sender and recipient)
 */
export async function createNotifications(payloads: NotificationPayload[]): Promise<boolean> {
  if (!supabase) {
    logger.warn('[NotificationHelper] Supabase not configured');
    return false;
  }

  if (payloads.length === 0) {
    return true;
  }

  try {
    logger.info('[NotificationHelper] Creating notifications:', { count: payloads.length, payloads: JSON.stringify(payloads) });
    
    const insertData = payloads.map(payload => ({
      user_id: payload.userId,
      title: payload.title,
      body: payload.body,
      category: payload.category,
      type: payload.type,
      amount: payload.amount,
      reference: payload.reference,
      sender_name: payload.senderName,
      recipient_name: payload.recipientName,
    }));

    logger.info('[NotificationHelper] Insert data:', { insertData: JSON.stringify(insertData) });

    const { data, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select();

    if (error) {
      logger.error('[NotificationHelper] Failed to create notifications:', error);
      return false;
    }

    logger.info('[NotificationHelper] Notifications created successfully:', { count: data?.length || 0 });
    return true;
  } catch (err) {
    logger.error('[NotificationHelper] Exception creating notifications:', err);
    return false;
  }
}

/**
 * Predefined notification templates for common transactions
 */
export const NotificationTemplates = {
  // Transfer notifications
  internalTransferSent: (recipientName: string, amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'Transfer Sent',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sent to ${recipientName}`,
    category: 'transfer',
    type: 'debit',
    amount,
    recipientName,
  }),

  internalTransferReceived: (senderName: string, amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'Transfer Received',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received from ${senderName}`,
    category: 'transfer',
    type: 'credit',
    amount,
    senderName,
  }),

  externalTransferSent: (recipientName: string, bankName: string, amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'External Transfer',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sent to ${recipientName} (${bankName})`,
    category: 'transfer',
    type: 'debit',
    amount,
    recipientName,
  }),

  // Funding notifications
  depositReceived: (amount: number, paymentMethod: string): Omit<NotificationPayload, 'userId'> => ({
    title: 'Funds Added',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added via ${paymentMethod}`,
    category: 'funding',
    type: 'credit',
    amount,
  }),

  withdrawalProcessed: (amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'Withdrawal Processed',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} withdrawn from your account`,
    category: 'transaction',
    type: 'debit',
    amount,
  }),

  // Bill payment notifications
  billPaymentSuccessful: (billType: string, amount: number, reference: string): Omit<NotificationPayload, 'userId'> => ({
    title: 'Bill Payment Successful',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid for ${billType}`,
    category: 'transaction',
    type: 'debit',
    amount,
    reference,
  }),

  // Airtime/Topup notifications
  airtimeTopup: (provider: string, amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'Airtime Purchase',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${provider} airtime purchased`,
    category: 'transaction',
    type: 'debit',
    amount,
  }),

  // Loan notifications
  loanApproved: (amount: number, tenor: string): Omit<NotificationPayload, 'userId'> => ({
    title: 'Loan Approved',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} approved for ${tenor} months`,
    category: 'transaction',
    type: 'credit',
    amount,
  }),

  loanRepayment: (amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'Loan Repayment',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} loan repayment processed`,
    category: 'transaction',
    type: 'debit',
    amount,
  }),

  // Security notifications
  pinChanged: (): Omit<NotificationPayload, 'userId'> => ({
    title: 'Security Update',
    body: 'Your transaction PIN was successfully changed',
    category: 'security',
  }),

  passwordChanged: (): Omit<NotificationPayload, 'userId'> => ({
    title: 'Security Update',
    body: 'Your password was successfully changed',
    category: 'security',
  }),

  loginAlert: (device: string): Omit<NotificationPayload, 'userId'> => ({
    title: 'New Login',
    body: `New login detected from ${device}`,
    category: 'security',
  }),

  // Investment notifications
  investmentPurchased: (amount: number, fundName: string): Omit<NotificationPayload, 'userId'> => ({
    title: 'Investment Purchased',
    body: `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} invested in ${fundName}`,
    category: 'transaction',
    type: 'debit',
    amount,
  }),

  // Card notifications
  virtualCardCreated: (cardType: string): Omit<NotificationPayload, 'userId'> => ({
    title: 'Card Created',
    body: `Your ${cardType} card has been created successfully`,
    category: 'transaction',
  }),

  cardOrderPlaced: (amount: number): Omit<NotificationPayload, 'userId'> => ({
    title: 'Card Order Placed',
    body: `Physical card order placed. Delivery fee: ₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    category: 'transaction',
    type: 'debit',
    amount,
  }),
};
