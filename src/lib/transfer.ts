/**
 * Transfer Operations - Supabase Primary
 */

import { supabaseAdmin } from './supabase';
import { getUserById, getUserByAccountNumber, getTodayDebitTotal, getTodayCreditTotal, transactionExists, createTransaction, createNotification } from './db';
import { logger } from './logger';

const DAILY_DEBIT_LIMITS_BY_KYC: Record<number, number> = {
  1: 50000 * 100,
  2: 500000 * 100,
  3: 5000000 * 100,
  4: Infinity,
};

const DAILY_RECEIVE_LIMITS_BY_KYC: Record<number, number> = {
  1: 200000 * 100,
  2: 5000000 * 100,
  3: Infinity,
  4: Infinity,
};

export async function performTransfer(
  senderUserId: string,
  recipientAccountNumber: string,
  amountInKobo: number,
  clientReference: string,
  narration?: string,
  message?: string,
  photo?: string,
): Promise<{ success: true; newSenderBalance: number; recipientName: string; reference: string } | { success: false; message: string }> {
  
  try {
    if (!supabaseAdmin) throw new Error('Supabase not initialized');

    // Idempotency check
    if (await transactionExists(clientReference)) {
      const sender = await getUserById(senderUserId);
      return { 
        success: true, 
        newSenderBalance: sender?.balance || 0, 
        recipientName: '', 
        reference: clientReference 
      };
    }

    // Get sender and recipient
    const sender = await getUserById(senderUserId);
    const recipient = await getUserByAccountNumber(recipientAccountNumber);

    if (!sender) return { success: false, message: 'Sender account not found.' };
    if (!recipient) return { success: false, message: 'Recipient account not found.' };

    // Check sender balance
    if (sender.balance < amountInKobo) {
      return { success: false, message: 'Insufficient funds.' };
    }

    // Check sender debit limit
    const senderDailyLimit = DAILY_DEBIT_LIMITS_BY_KYC[sender.kyc_tier] ?? DAILY_DEBIT_LIMITS_BY_KYC[1];
    const senderTodayDebit = await getTodayDebitTotal(senderUserId);
    if (senderTodayDebit + amountInKobo > senderDailyLimit) {
      return { 
        success: false, 
        message: `Daily transfer limit exceeded. You can send up to ₦${(senderDailyLimit / 100).toLocaleString('en-NG')} per day.` 
      };
    }

    // Check recipient receive limit
    const recipientDailyLimit = DAILY_RECEIVE_LIMITS_BY_KYC[recipient.kyc_tier] ?? DAILY_RECEIVE_LIMITS_BY_KYC[1];
    const recipientTodayCredit = await getTodayCreditTotal(recipient.id);
    if (recipientTodayCredit + amountInKobo > recipientDailyLimit) {
      return { 
        success: false, 
        message: `Recipient's daily receive limit exceeded. Maximum daily limit is ₦${(recipientDailyLimit / 100).toLocaleString('en-NG')}.` 
      };
    }

    // Calculate new balances
    const newSenderBalance = sender.balance - amountInKobo;
    const newRecipientBalance = recipient.balance + amountInKobo;

    // Execute transfer in transaction
    const { error: txError } = await supabaseAdmin.rpc('perform_transfer', {
      p_sender_id: senderUserId,
      p_recipient_id: recipient.id,
      p_amount: amountInKobo,
      p_reference: clientReference,
      p_narration: narration || `Transfer to ${recipient.full_name}`,
      p_sender_name: sender.full_name,
      p_recipient_name: recipient.full_name,
      p_sender_account: sender.account_number,
      p_recipient_account: recipient.account_number,
      p_memo_message: message,
      p_memo_image: photo,
    });

    if (txError) throw txError;

    // Create notifications
    await Promise.all([
      createNotification({
        user_id: senderUserId,
        title: 'Money Sent',
        body: `Debited to ${recipient.full_name}`,
        category: 'transfer',
        type: 'debit',
        amount: amountInKobo,
        recipient_name: recipient.full_name,
        reference: clientReference,
        read: false,
      }),
      createNotification({
        user_id: recipient.id,
        title: 'Money Received',
        body: `Account credited by ${sender.full_name}`,
        category: 'transfer',
        type: 'credit',
        amount: amountInKobo,
        sender_name: sender.full_name,
        reference: clientReference,
        read: false,
      }),
    ]);

    return { 
      success: true, 
      newSenderBalance, 
      recipientName: recipient.full_name, 
      reference: clientReference 
    };

  } catch (error) {
    logger.error('Transfer failed:', error);
    if (error instanceof Error) return { success: false, message: error.message };
    return { success: false, message: 'An unexpected error occurred during the transfer.' };
  }
}
