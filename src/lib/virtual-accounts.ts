/**
 * Virtual Account Management System
 * Handles VFD virtual account creation, mapping, and reconciliation
 */

import { supabaseAdmin } from './supabase';
import { VirtualAccountRequest } from './vfd-wallet';
import { logger } from './logger';

// Types
export interface VirtualAccount {
  id: string;
  userId: string;
  vfdAccountNumber: string;
  reference: string;
  amount: string;
  status: 'active' | 'expired' | 'used';
  validityTime: string;
  merchantName: string;
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  userId: string;
  balance: number; // in kobo
  ledgerBalance: number; // in kobo
  lastUpdated: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  vfdAccountNumber?: string;
  reference: string;
  type: 'credit' | 'debit';
  amount: number; // in kobo
  description: string;
  status: 'pending' | 'completed' | 'failed';
  vfdTransactionId?: string;
  createdAt: string;
}

/**
 * Create a VFD virtual account for a user
 */
export async function createUserVirtualAccount(
  userId: string,
  amount: number, // in kobo
  reference?: string
): Promise<{ success: boolean; data?: VirtualAccount; error?: string }> {
  try {
    // Generate unique reference if not provided
    const txnRef = reference || `VA_${userId}_${Date.now()}`;
    
    // Call API endpoint instead of direct VFD call
    const response = await fetch('/api/virtual-accounts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        amount,
        reference: txnRef
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to create virtual account' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error creating virtual account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get user's virtual accounts
 */
export async function getUserVirtualAccounts(userId: string): Promise<VirtualAccount[]> {
  try {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin
      .from('virtual_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch virtual accounts', { error, userId });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching virtual accounts', { error, userId });
    return [];
  }
}

/**
 * Process inbound transfer from VFD webhook
 */
export async function processInboundTransfer(webhookData: {
  accountNumber: string;
  amount: string;
  senderName: string;
  senderAccount: string;
  senderBank: string;
  reference: string;
  sessionId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' };

    const { accountNumber, amount, senderName, reference, sessionId } = webhookData;
    
    // Convert amount to kobo
    const amountInKobo = Math.round(parseFloat(amount) * 100);

    const { data: virtualAccount, error: vaError } = await supabaseAdmin
      .from('virtual_accounts')
      .select('*')
      .eq('vfdAccountNumber', accountNumber)
      .eq('status', 'active')
      .single();

    if (vaError || !virtualAccount) {
      logger.error('Virtual account not found', { accountNumber, reference });
      return { success: false, error: 'Virtual account not found' };
    }

    const { data: existingTxn } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingTxn) {
      logger.info('Duplicate transaction ignored', { reference });
      return { success: true };
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', virtualAccount.userId)
      .single();

    if (userError || !user) {
      logger.error('User not found', { userId: virtualAccount.userId });
      return { success: false, error: 'User not found' };
    }

    const newBalance = user.balance + amountInKobo;

    const { error: updateError } = await supabaseAdmin.rpc('process_inbound_transfer', {
      p_user_id: virtualAccount.userId,
      p_amount: amountInKobo,
      p_reference: reference,
      p_sender_name: senderName,
      p_vfd_account: accountNumber,
      p_session_id: sessionId
    });

    if (updateError) {
      logger.error('Failed to process inbound transfer', { updateError, reference });
      return { success: false, error: 'Failed to process transfer' };
    }

    await supabaseAdmin
      .from('virtual_accounts')
      .update({ status: 'used', updatedAt: new Date().toISOString() })
      .eq('id', virtualAccount.id);

    logger.info('Inbound transfer processed successfully', {
      userId: virtualAccount.userId,
      amount: amountInKobo,
      reference,
      newBalance
    });

    return { success: true };
  } catch (error) {
    logger.error('Error processing inbound transfer', { error, webhookData });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get wallet balance for user
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  try {
    if (!supabaseAdmin) {
      logger.error('Supabase admin client not available');
      return {
        userId,
        balance: 0,
        ledgerBalance: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch wallet balance', { error, userId });
      return {
        userId,
        balance: 0,
        ledgerBalance: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    const balance = data?.balance || 0;
    return {
      userId,
      balance,
      ledgerBalance: balance,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching wallet balance', { error, userId });
    return {
      userId,
      balance: 0,
      ledgerBalance: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Initiate outbound transfer via VFD
 */
export async function initiateOutboundTransfer(
  userId: string,
  amount: number,
  recipientAccount: string,
  recipientBank: string,
  narration: string
): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' };

    const balance = await getWalletBalance(userId);
    if (!balance || balance.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const reference = `OUT_${userId}_${Date.now()}`;
    
    const { error: debitError } = await supabaseAdmin.rpc('process_outbound_transfer', {
      p_user_id: userId,
      p_amount: amount,
      p_reference: reference,
      p_recipient_account: recipientAccount,
      p_recipient_bank: recipientBank,
      p_narration: narration
    });

    if (debitError) {
      logger.error('Failed to debit wallet for outbound transfer', { debitError, userId });
      return { success: false, error: 'Failed to process transfer' };
    }

    try {
      const { executeVFDTransfer } = await import('./vfd-transfer');
      const vfdResult = await executeVFDTransfer(
        amount,
        recipientAccount,
        recipientBank,
        narration,
        reference
      );

      if (vfdResult.success) {
        await supabaseAdmin
          .from('wallet_transactions')
          .update({
            status: 'completed',
            vfd_transaction_id: vfdResult.sessionId
          })
          .eq('reference', reference);

        logger.info('Outbound transfer completed', { userId, amount, reference });
        return { success: true, reference };
      } else {
        await supabaseAdmin.rpc('refund_failed_transfer', {
          p_user_id: userId,
          p_amount: amount,
          p_reference: reference
        });

        logger.error('VFD transfer failed, refunded user', {
          userId,
          reference,
          error: vfdResult.error
        });
        return { success: false, error: vfdResult.error || 'Transfer failed' };
      }
    } catch (importError) {
      logger.error('Failed to import VFD transfer module', { importError });
      return { success: false, error: 'Transfer service unavailable' };
    }
    try {
      const { executeVFDTransfer } = await import('./vfd-transfer');
      const vfdResult = await executeVFDTransfer(
        amount,
        recipientAccount,
        recipientBank,
        narration,
        reference
      );

      if (vfdResult.success) {
        await supabaseAdmin
          .from('wallet_transactions')
          .update({
            status: 'completed',
            vfd_transaction_id: vfdResult.sessionId
          })
          .eq('reference', reference);

        logger.info('Outbound transfer completed', { userId, amount, reference });
        return { success: true, reference };
      } else {
        await supabaseAdmin.rpc('refund_failed_transfer', {
          p_user_id: userId,
          p_amount: amount,
          p_reference: reference
        });

        logger.error('VFD transfer failed, refunded user', {
          userId,
          reference,
          error: vfdResult.error
        });
        return { success: false, error: vfdResult.error || 'Transfer failed' };
      }
    } catch (importError) {
      logger.error('Failed to import VFD transfer module', { importError });
      return { success: false, error: 'Transfer service unavailable' };
    }
  } catch (error) {
    logger.error('Error initiating outbound transfer', { error, userId });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}