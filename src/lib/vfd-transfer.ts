/**
 * VFD Transfer Integration
 * Handles outbound transfers via VFD Wallet API
 */

import vfdWalletAPI, { 
  getAccountEnquiry, 
  getTransferRecipient, 
  initiateTransfer,
  TransferRequest 
} from './vfd-wallet';
import { logger } from './logger';

export interface TransferRecipientInfo {
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

export interface TransferResult {
  success: boolean;
  reference?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Get VFD pool account details
 */
export async function getVFDPoolAccount() {
  try {
    const result = await getAccountEnquiry();
    
    if (!result.ok || !result.data) {
      logger.error('Failed to get VFD pool account', { error: result.message });
      return null;
    }

    return {
      accountNumber: result.data.accountNo,
      balance: result.data.accountBalance,
      accountId: result.data.accountId,
      clientId: result.data.clientId
    };
  } catch (error) {
    logger.error('Error getting VFD pool account', { error });
    return null;
  }
}

/**
 * Validate transfer recipient
 */
export async function validateRecipient(
  accountNumber: string,
  bankCode: string
): Promise<{ valid: boolean; name?: string; error?: string }> {
  try {
    // Determine transfer type (intra for VFD, inter for others)
    const transferType = bankCode === '566' ? 'intra' : 'inter';
    
    const result = await getTransferRecipient(accountNumber, bankCode, transferType);
    
    if (!result.ok || !result.data) {
      return { valid: false, error: result.message || 'Account not found' };
    }

    return {
      valid: true,
      name: result.data.name
    };
  } catch (error) {
    logger.error('Error validating recipient', { error, accountNumber, bankCode });
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Execute transfer via VFD
 */
export async function executeVFDTransfer(
  amount: number, // in kobo
  recipientAccount: string,
  recipientBank: string,
  narration: string,
  reference: string
): Promise<TransferResult> {
  try {
    // Get pool account details
    const poolAccount = await getVFDPoolAccount();
    if (!poolAccount) {
      return { success: false, error: 'VFD pool account not available' };
    }

    // Validate recipient first
    const validation = await validateRecipient(recipientAccount, recipientBank);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Prepare transfer request
    const transferRequest: TransferRequest = {
      fromAccount: poolAccount.accountNumber,
      fromClientId: poolAccount.clientId,
      fromClient: 'Ovomonie Pool',
      fromSavingsId: poolAccount.accountId,
      toClient: validation.name || 'Unknown',
      toAccount: recipientAccount,
      toBank: recipientBank,
      signature: 'OVOMONIE_TRANSFER', // VFD signature
      amount: (amount / 100).toString(), // Convert kobo to naira
      remark: narration,
      transferType: recipientBank === '566' ? 'intra' : 'inter',
      reference,
      uniqueSenderAccountId: poolAccount.accountId
    };

    logger.info('Initiating VFD transfer', { 
      reference, 
      amount: transferRequest.amount,
      recipient: recipientAccount 
    });

    const result = await initiateTransfer(transferRequest);

    if (result.status === '00' && result.data) {
      logger.info('VFD transfer successful', { 
        reference, 
        txnId: result.data.txnId,
        sessionId: result.data.sessionId 
      });

      return {
        success: true,
        reference: result.data.reference || reference,
        sessionId: result.data.sessionId
      };
    }

    logger.error('VFD transfer failed', { result, reference });
    return { 
      success: false, 
      error: result.message || 'Transfer failed' 
    };

  } catch (error) {
    logger.error('Error executing VFD transfer', { error, reference });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check transfer status
 */
export async function checkTransferStatus(
  reference: string,
  sessionId?: string
): Promise<{ 
  status: string; 
  amount?: string; 
  transactionDate?: string; 
  error?: string 
}> {
  try {
    const { getTransactionStatus } = vfdWalletAPI;
    
    const result = await getTransactionStatus(
      sessionId ? { sessionId } : { reference }
    );

    if (result.status === '00' && result.data) {
      return {
        status: result.data.transactionStatus,
        amount: result.data.amount,
        transactionDate: result.data.transactionDate
      };
    }

    return { 
      status: 'unknown', 
      error: result.message || 'Status check failed' 
    };

  } catch (error) {
    logger.error('Error checking transfer status', { error, reference });
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}