/**
 * VFD Debit Card Service
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/debit-card
 */

import { getVFDHeaders } from './vfd-auth';
import { logger } from './logger';

const BASE_URL = process.env.VFD_DEBIT_CARD_API_BASE || process.env.VFD_CARDS_API_BASE || 'https://api-devapps.vfdbank.systems/vfd-wallet/api/v2';
const WALLET_ID = process.env.VFD_WALLET_ID || process.env.VFD_CONSUMER_KEY;

interface VFDResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface CreateCardRequest {
  accountNumber: string;
  cardType: 'PHYSICAL' | 'VIRTUAL';
  deliveryAddress?: string;
}

export interface DebitCard {
  cardId: string;
  cardNumber: string;
  cardType: 'PHYSICAL' | 'VIRTUAL';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'EXPIRED';
  expiryDate: string;
  cvv?: string;
  balance: string;
}

export interface CardTransactionRequest {
  cardId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface CardTransaction {
  transactionId: string;
  amount: string;
  merchant: string;
  date: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

class VFDDebitCardService {
  /**
   * Request a new debit card (physical or virtual)
   */
  async createCard(request: CreateCardRequest): Promise<DebitCard> {
    const headers = await getVFDHeaders();

    logger.info('VFD Card: Creating card', { accountNumber: request.accountNumber, cardType: request.cardType });

    const payload = {
      walletId: WALLET_ID,
      accountNumber: request.accountNumber,
      cardType: request.cardType,
      ...(request.deliveryAddress && { deliveryAddress: request.deliveryAddress }),
    };

    logger.info('VFD Card: Request payload', { payload });

    const response = await fetch(`${BASE_URL}/cards/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    logger.info('VFD Card: Response', { status: response.status, body: text });
    
    if (!response.ok) {
      logger.error('VFD Card: Creation failed', { status: response.status, error: text });
      let errorMsg = `Card creation failed (${response.status})`;
      try {
        const errorData = JSON.parse(text);
        errorMsg = errorData.message || errorData.responseMessage || errorData.error || text || errorMsg;
      } catch {
        errorMsg = text || errorMsg;
      }
      throw new Error(errorMsg);
    }

    let result: any;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      logger.error('VFD Card: Failed to parse response', { text });
      throw new Error('Invalid response from VFD API');
    }

    // VFD API may return status as '00' or responseCode as '00'
    const isSuccess = result.status === '00' || result.responseCode === '00' || result.success === true;

    if (!isSuccess) {
      logger.error('VFD Card: API returned error', { result });
      throw new Error(result.message || result.responseMessage || 'Card creation failed');
    }

    logger.info('VFD Card: Created successfully', { result });
    return result.data || result;
  }

  /**
   * Get card details
   */
  async getCardDetails(cardId: string): Promise<DebitCard> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/card/details?cardId=${encodeURIComponent(cardId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get card details: ${response.status}`);
    }

    const result: VFDResponse<DebitCard> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get card details');
    }

    return result.data;
  }

  /**
   * Get all cards for an account
   */
  async getAccountCards(accountNumber: string): Promise<DebitCard[]> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/card/list?accountNumber=${encodeURIComponent(accountNumber)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get cards: ${response.status}`);
    }

    const result: VFDResponse<{ cards: DebitCard[] }> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get cards');
    }

    return result.data.cards || [];
  }

  /**
   * Block/freeze a card
   */
  async blockCard(cardId: string, reason: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Card: Blocking card', { cardId });

    const response = await fetch(`${BASE_URL}/card/block`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cardId, reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to block card: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to block card');
    }

    logger.info('VFD Card: Blocked successfully', { cardId });
  }

  /**
   * Unblock/unfreeze a card
   */
  async unblockCard(cardId: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Card: Unblocking card', { cardId });

    const response = await fetch(`${BASE_URL}/card/unblock`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cardId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unblock card: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to unblock card');
    }

    logger.info('VFD Card: Unblocked successfully', { cardId });
  }

  /**
   * Get card transaction history
   */
  async getCardTransactions(request: CardTransactionRequest): Promise<CardTransaction[]> {
    const headers = await getVFDHeaders();

    const params = new URLSearchParams({
      cardId: request.cardId,
      ...(request.startDate && { startDate: request.startDate }),
      ...(request.endDate && { endDate: request.endDate }),
      ...(request.limit && { limit: request.limit.toString() }),
    });

    const response = await fetch(`${BASE_URL}/card/transactions?${params}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get card transactions: ${response.status}`);
    }

    const result: VFDResponse<{ transactions: CardTransaction[] }> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get card transactions');
    }

    return result.data.transactions || [];
  }

  /**
   * Change card PIN
   */
  async changeCardPIN(cardId: string, oldPIN: string, newPIN: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Card: Changing PIN', { cardId });

    const response = await fetch(`${BASE_URL}/card/pin/change`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cardId, oldPIN, newPIN }),
    });

    if (!response.ok) {
      throw new Error(`Failed to change PIN: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to change PIN');
    }

    logger.info('VFD Card: PIN changed successfully', { cardId });
  }
}

export const vfdDebitCardService = new VFDDebitCardService();
