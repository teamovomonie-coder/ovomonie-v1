/**
 * VFD Direct Debit (Mandate) Service
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/direct-debit
 */

import { getVFDHeaders } from './vfd-auth';
import { logger } from './logger';

const BASE_URL = 'https://api-devapps.vfdbank.systems/vtech-directdebit/api/v2/mandate';

interface VFDResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface CreateMandateRequest {
  customerId: string;
  accountNumber: string;
  bankCode: string;
  amount: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  reference: string;
  narration: string;
}

export interface Mandate {
  mandateId: string;
  customerId: string;
  accountNumber: string;
  bankCode: string;
  amount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  reference: string;
}

export interface ExecuteDebitRequest {
  mandateId: string;
  amount: string;
  reference: string;
  narration: string;
}

export interface DebitExecution {
  status: string;
  message: string;
  reference: string;
  transactionId: string;
}

class VFDMandateService {
  /**
   * Create a new mandate for direct debit
   */
  async createMandate(request: CreateMandateRequest): Promise<Mandate> {
    const headers = await getVFDHeaders();

    logger.info('VFD Mandate: Creating mandate', { 
      customerId: request.customerId,
      reference: request.reference,
    });

    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Mandate: Creation failed', { status: response.status, error });
      throw new Error(`Mandate creation failed: ${response.status}`);
    }

    const result: VFDResponse<Mandate> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Mandate creation failed');
    }

    logger.info('VFD Mandate: Created successfully', { mandateId: result.data.mandateId });
    return result.data;
  }

  /**
   * Get mandate details
   */
  async getMandateDetails(mandateId: string): Promise<Mandate> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/details?mandateId=${encodeURIComponent(mandateId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get mandate details: ${response.status}`);
    }

    const result: VFDResponse<Mandate> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get mandate details');
    }

    return result.data;
  }

  /**
   * Get all mandates for a customer
   */
  async getCustomerMandates(customerId: string): Promise<Mandate[]> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/customer-mandates?customerId=${encodeURIComponent(customerId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get customer mandates: ${response.status}`);
    }

    const result: VFDResponse<{ mandates: Mandate[] }> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get customer mandates');
    }

    return result.data.mandates || [];
  }

  /**
   * Cancel a mandate
   */
  async cancelMandate(mandateId: string, reason: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Mandate: Cancelling mandate', { mandateId });

    const response = await fetch(`${BASE_URL}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mandateId, reason }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Mandate: Cancellation failed', { status: response.status, error });
      throw new Error(`Mandate cancellation failed: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Mandate cancellation failed');
    }

    logger.info('VFD Mandate: Cancelled successfully', { mandateId });
  }

  /**
   * Execute debit using mandate
   */
  async executeDebit(request: ExecuteDebitRequest): Promise<DebitExecution> {
    const headers = await getVFDHeaders();

    logger.info('VFD Mandate: Executing debit', { 
      mandateId: request.mandateId,
      reference: request.reference,
    });

    const response = await fetch(`${BASE_URL}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Mandate: Debit execution failed', { status: response.status, error });
      throw new Error(`Debit execution failed: ${response.status}`);
    }

    const result: VFDResponse<DebitExecution> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Debit execution failed');
    }

    logger.info('VFD Mandate: Debit executed successfully', { 
      reference: request.reference,
      transactionId: result.data.transactionId,
    });

    return result.data;
  }
}

export const vfdMandateService = new VFDMandateService();
