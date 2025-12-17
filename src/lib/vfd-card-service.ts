/**
 * VFD Card Payment Service
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/card-api
 */

import { getVFDAccessToken } from './vfd-auth';
import { logger } from './logger';

const BASE_URL = process.env.VFD_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

interface VFDResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface InitiatePaymentRequest {
  amount: string;
  reference: string;
  useExistingCard: boolean;
  cardNumber?: string;
  cardPin?: string;
  cvv2?: string;
  expiryDate?: string; // Format: yymm
  shouldTokenize?: boolean;
}

export interface InitiatePaymentResponse {
  reference: string;
  status: string;
  message: string;
  requiresOTP?: boolean;
  requiresPIN?: boolean;
}

export interface AuthorizeRequest {
  reference: string;
  otp?: string;
  pin?: string;
}

export interface AuthorizeResponse {
  status: string;
  message: string;
  reference: string;
  transactionStatus: string;
}

export interface PaymentDetails {
  reference: string;
  amount: string;
  status: string;
  transactionDate: string;
}

class VFDCardService {
  /**
   * Get headers for VFD Card API
   * Note: Card API uses AccessToken header, not Authorization Bearer
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await getVFDAccessToken();
    return {
      'AccessToken': token,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initiate card payment
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const headers = await this.getHeaders();

    logger.info('VFD Card: Initiating payment', { reference: request.reference, amount: request.amount });

    const response = await fetch(`${BASE_URL}/initiate/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Card: Payment initiation failed', { status: response.status, error });
      throw new Error(`Payment initiation failed: ${response.status}`);
    }

    const result: VFDResponse<InitiatePaymentResponse> = await response.json();

    logger.info('VFD Card: Payment initiated', { 
      reference: request.reference, 
      status: result.status,
      requiresOTP: result.data?.requiresOTP,
      requiresPIN: result.data?.requiresPIN,
    });

    if (result.status !== '00' && result.status !== '09') {
      throw new Error(result.message || 'Payment initiation failed');
    }

    return {
      reference: request.reference,
      status: result.status,
      message: result.message,
      requiresOTP: result.data?.requiresOTP,
      requiresPIN: result.data?.requiresPIN,
    };
  }

  /**
   * Authorize payment with OTP
   */
  async authorizeWithOTP(reference: string, otp: string): Promise<AuthorizeResponse> {
    const headers = await this.getHeaders();

    logger.info('VFD Card: Authorizing with OTP', { reference });

    const response = await fetch(`${BASE_URL}/authorize-otp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reference, otp }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Card: OTP authorization failed', { status: response.status, error });
      throw new Error(`OTP authorization failed: ${response.status}`);
    }

    const result: VFDResponse<AuthorizeResponse> = await response.json();

    logger.info('VFD Card: OTP authorization result', { reference, status: result.status });

    if (result.status !== '00') {
      throw new Error(result.message || 'OTP authorization failed');
    }

    return result.data;
  }

  /**
   * Authorize payment with PIN
   */
  async authorizeWithPIN(reference: string, pin: string): Promise<AuthorizeResponse> {
    const headers = await this.getHeaders();

    logger.info('VFD Card: Authorizing with PIN', { reference });

    const response = await fetch(`${BASE_URL}/authorize-pin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reference, pin }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Card: PIN authorization failed', { status: response.status, error });
      throw new Error(`PIN authorization failed: ${response.status}`);
    }

    const result: VFDResponse<AuthorizeResponse> = await response.json();

    logger.info('VFD Card: PIN authorization result', { reference, status: result.status });

    if (result.status !== '00') {
      throw new Error(result.message || 'PIN authorization failed');
    }

    return result.data;
  }

  /**
   * Validate OTP (alternative to authorize-otp)
   */
  async validateOTP(reference: string, otp: string): Promise<AuthorizeResponse> {
    const headers = await this.getHeaders();

    const response = await fetch(`${BASE_URL}/validate-otp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reference, otp }),
    });

    if (!response.ok) {
      throw new Error(`OTP validation failed: ${response.status}`);
    }

    const result: VFDResponse<AuthorizeResponse> = await response.json();
    return result.data;
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(reference: string): Promise<PaymentDetails> {
    const headers = await this.getHeaders();

    const response = await fetch(`${BASE_URL}/payment-details?reference=${encodeURIComponent(reference)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment details: ${response.status}`);
    }

    const result: VFDResponse<PaymentDetails> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get payment details');
    }

    return result.data;
  }
}

export const vfdCardService = new VFDCardService();
