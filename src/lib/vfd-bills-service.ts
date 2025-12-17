/**
 * VFD Bills Payment Service
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/bills-payment-api
 */

import { getVFDHeaders } from './vfd-auth';
import { logger } from './logger';

const BASE_URL = process.env.VFD_BILLS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';

interface VFDResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface BillerCategory {
  category: string;
}

export interface Biller {
  id: string;
  name: string;
  division: string;
  product: string;
  category: string;
  convenienceFee?: string;
}

export interface BillerItem {
  id: string;
  paymentitemname: string;
  amount: string;
  isAmountFixed: string;
  itemFee: string;
}

export interface CustomerValidation {
  status: string;
  message: string;
  customerName?: string;
}

export interface BillPaymentRequest {
  customerId: string;
  amount: string;
  division: string;
  paymentItem: string;
  productId: string;
  billerId: string;
  reference: string;
  phoneNumber?: string;
}

export interface BillPaymentResponse {
  status: string;
  message: string;
  reference: string;
  token?: string;
  KCT1?: string;
  KCT2?: string;
}

export interface TransactionStatus {
  status: string;
  message: string;
  transactionStatus: string;
  amount: string;
  token?: string;
}

class VFDBillsService {
  /**
   * Get all biller categories
   */
  async getBillerCategories(): Promise<BillerCategory[]> {
    const headers = await getVFDHeaders();
    const response = await fetch(`${BASE_URL}/billercategory`, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch biller categories: ${response.status}`);
    }

    const result: VFDResponse<BillerCategory[]> = await response.json();
    
    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to fetch biller categories');
    }

    return result.data || [];
  }

  /**
   * Get billers by category
   */
  async getBillerList(categoryName?: string): Promise<Biller[]> {
    const headers = await getVFDHeaders();
    const url = categoryName 
      ? `${BASE_URL}/billerlist?categoryName=${encodeURIComponent(categoryName)}`
      : `${BASE_URL}/billerlist`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch biller list: ${response.status}`);
    }

    const result: VFDResponse<Biller[]> = await response.json();
    
    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to fetch biller list');
    }

    return result.data || [];
  }

  /**
   * Get items for a specific biller
   */
  async getBillerItems(billerId: string, divisionId: string, productId: string): Promise<BillerItem[]> {
    const headers = await getVFDHeaders();
    const url = `${BASE_URL}/billerItems?billerId=${billerId}&divisionId=${divisionId}&productId=${productId}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch biller items: ${response.status}`);
    }

    const result: VFDResponse<{ paymentitems: BillerItem[] }> = await response.json();
    
    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to fetch biller items');
    }

    return result.data?.paymentitems || [];
  }

  /**
   * Validate customer ID (required for utility, cable TV, betting, gaming)
   */
  async validateCustomer(
    customerId: string,
    divisionId: string,
    paymentItem: string,
    billerId: string
  ): Promise<CustomerValidation> {
    const headers = await getVFDHeaders();
    const url = `${BASE_URL}/customervalidate?divisionId=${divisionId}&paymentItem=${paymentItem}&customerId=${encodeURIComponent(customerId)}&billerId=${billerId}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to validate customer: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Pay a bill
   */
  async payBill(request: BillPaymentRequest): Promise<BillPaymentResponse> {
    const headers = await getVFDHeaders();

    logger.info('VFD Bills: Initiating payment', { reference: request.reference, billerId: request.billerId });

    const response = await fetch(`${BASE_URL}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Bills: Payment failed', { status: response.status, error });
      throw new Error(`Payment failed: ${response.status}`);
    }

    const result: VFDResponse<BillPaymentResponse> = await response.json();

    logger.info('VFD Bills: Payment response', { status: result.status, reference: request.reference });

    // Status codes: 00 = success, 09 = pending
    if (result.status === '00' || result.status === '09') {
      return {
        status: result.status,
        message: result.message,
        reference: request.reference,
        token: result.data?.token,
        KCT1: result.data?.KCT1,
        KCT2: result.data?.KCT2,
      };
    }

    throw new Error(result.message || 'Payment failed');
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const headers = await getVFDHeaders();
    const url = `${BASE_URL}/transactionStatus?transactionId=${encodeURIComponent(transactionId)}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to get transaction status: ${response.status}`);
    }

    const result: VFDResponse<TransactionStatus> = await response.json();
    
    if (result.status === '108') {
      throw new Error('Transaction not found');
    }

    return result.data;
  }
}

export const vfdBillsService = new VFDBillsService();
