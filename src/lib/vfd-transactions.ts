/**
 * VFD Transaction Handler
 * Primary payment gateway for all transactions and money transfers
 * Supabase PostgreSQL acts as secondary backup
 */

import { logger } from '@/lib/logger';

const VFD_API_BASE = process.env.VFD_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

interface VFDTransactionRequest {
  senderPhone: string;
  senderPin: string;
  recipientPhone?: string;
  recipientAccountNumber?: string;
  amount: number; // in naira
  reference: string;
  narration: string;
  transactionType: 'transfer' | 'withdrawal' | 'deposit';
}

interface VFDTransactionResponse {
  success: boolean;
  reference: string;
  transactionId?: string;
  message: string;
  amount?: number;
  balance?: number;
  timestamp: string;
}

/**
 * Get VFD Access Token
 */
async function getVFDToken(): Promise<string | null> {
  try {
    const key = process.env.VFD_CONSUMER_KEY;
    const secret = process.env.VFD_CONSUMER_SECRET;
    const tokenUrl = process.env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';

    if (!key || !secret) {
      logger.warn('[VFD] Missing credentials');
      return null;
    }

    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      logger.error('[VFD] Token request failed', { status: response.status });
      return null;
    }

    const data = await response.json();
    return data.access_token || data.token || null;
  } catch (error) {
    logger.error('[VFD] Token fetch error:', error);
    return null;
  }
}

/**
 * Process internal transfer via VFD
 * Transfers between two Ovomonie users
 */
export async function processVFDInternalTransfer(
  senderPhone: string,
  senderPin: string,
  recipientPhone: string,
  amount: number,
  reference: string,
  narration: string
): Promise<VFDTransactionResponse> {
  try {
    const token = await getVFDToken();
    if (!token) {
      return {
        success: false,
        reference,
        message: 'Failed to authenticate with payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    // VFD transfer endpoint
    const response = await fetch(`${VFD_API_BASE}/transfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_phone: senderPhone,
        sender_pin: senderPin,
        recipient_phone: recipientPhone,
        amount_naira: amount,
        reference: reference,
        narration: narration,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error('[VFD] Transfer failed', { status: response.status, error });
      return {
        success: false,
        reference,
        message: error.message || 'Transfer failed at payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      reference,
      transactionId: data.transaction_id || data.txn_id,
      message: 'Transfer successful',
      amount: data.amount_naira || amount,
      balance: data.new_balance,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[VFD] Internal transfer error:', error);
    return {
      success: false,
      reference,
      message: error instanceof Error ? error.message : 'Internal transfer failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Process deposit/add money via VFD
 */
export async function processVFDDeposit(
  userPhone: string,
  userPin: string,
  amount: number,
  reference: string,
  paymentMethod: 'card' | 'bank_transfer' | 'ussd' = 'card',
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardPin?: string;
  }
): Promise<VFDTransactionResponse> {
  try {
    const token = await getVFDToken();
    if (!token) {
      return {
        success: false,
        reference,
        message: 'Failed to authenticate with payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    const requestBody: any = {
      user_phone: userPhone,
      user_pin: userPin,
      amount_naira: amount,
      reference: reference,
      payment_method: paymentMethod,
    };

    // Add card details if provided
    if (cardDetails && paymentMethod === 'card') {
      requestBody.card_number = cardDetails.cardNumber;
      requestBody.expiry_date = cardDetails.expiryDate;
      requestBody.cvv = cardDetails.cvv;
      if (cardDetails.cardPin) {
        requestBody.card_pin = cardDetails.cardPin;
      }
    }

    const response = await fetch(`${VFD_API_BASE}/deposit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error('[VFD] Deposit failed', { status: response.status, error });
      return {
        success: false,
        reference,
        message: error.message || 'Deposit failed at payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      reference,
      transactionId: data.transaction_id || data.txn_id,
      message: 'Deposit successful',
      amount: data.amount_naira || amount,
      balance: data.new_balance,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[VFD] Deposit error:', error);
    return {
      success: false,
      reference,
      message: error instanceof Error ? error.message : 'Deposit failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Process withdrawal via VFD
 */
export async function processVFDWithdrawal(
  userPhone: string,
  userPin: string,
  transactionPin: string,
  amount: number,
  reference: string,
  bankAccountNumber?: string
): Promise<VFDTransactionResponse> {
  try {
    const token = await getVFDToken();
    if (!token) {
      return {
        success: false,
        reference,
        message: 'Failed to authenticate with payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch(`${VFD_API_BASE}/withdrawal`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_phone: userPhone,
        user_pin: userPin,
        transaction_pin: transactionPin,
        amount_naira: amount,
        reference: reference,
        bank_account: bankAccountNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error('[VFD] Withdrawal failed', { status: response.status, error });
      return {
        success: false,
        reference,
        message: error.message || 'Withdrawal failed at payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      reference,
      transactionId: data.transaction_id || data.txn_id,
      message: 'Withdrawal successful',
      amount: data.amount_naira || amount,
      balance: data.new_balance,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[VFD] Withdrawal error:', error);
    return {
      success: false,
      reference,
      message: error instanceof Error ? error.message : 'Withdrawal failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Query transaction status
 */
export async function queryVFDTransaction(reference: string): Promise<VFDTransactionResponse> {
  try {
    const token = await getVFDToken();
    if (!token) {
      return {
        success: false,
        reference,
        message: 'Failed to authenticate with payment gateway',
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch(`${VFD_API_BASE}/transaction/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        reference,
        message: 'Transaction not found',
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: data.status === 'success' || data.status === 'completed',
      reference,
      transactionId: data.transaction_id || data.txn_id,
      message: data.message || data.status,
      amount: data.amount_naira || data.amount,
      balance: data.balance,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[VFD] Query transaction error:', error);
    return {
      success: false,
      reference,
      message: error instanceof Error ? error.message : 'Failed to query transaction',
      timestamp: new Date().toISOString(),
    };
  }
}
