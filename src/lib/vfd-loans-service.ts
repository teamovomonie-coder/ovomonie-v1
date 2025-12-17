/**
 * VFD Loans Service
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/loans-api
 */

import { getVFDHeaders } from './vfd-auth';
import { logger } from './logger';

const BASE_URL = 'https://api-devapps.vfdbank.systems/vtech-loans/api/v2/loans';

interface VFDResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface LoanApplicationRequest {
  customerId: string;
  amount: string;
  tenure: number; // in months
  purpose: string;
  reference: string;
}

export interface LoanApplication {
  loanId: string;
  status: string;
  amount: string;
  tenure: number;
  interestRate: string;
  monthlyRepayment: string;
}

export interface LoanDetails {
  loanId: string;
  customerId: string;
  amount: string;
  tenure: number;
  interestRate: string;
  monthlyRepayment: string;
  outstandingBalance: string;
  status: string;
  disbursementDate: string;
}

export interface LoanHistory {
  loans: Array<{
    loanId: string;
    amount: string;
    status: string;
    disbursementDate: string;
  }>;
}

export interface RepaymentRequest {
  loanId: string;
  amount: string;
  reference: string;
}

export interface RepaymentResponse {
  status: string;
  message: string;
  reference: string;
  outstandingBalance: string;
}

export interface RepaymentSchedule {
  loanId: string;
  schedule: Array<{
    dueDate: string;
    amount: string;
    principal: string;
    interest: string;
    status: string;
  }>;
}

class VFDLoansService {
  /**
   * Apply for a loan
   */
  async applyForLoan(request: LoanApplicationRequest): Promise<LoanApplication> {
    const headers = await getVFDHeaders();

    logger.info('VFD Loans: Applying for loan', { 
      customerId: request.customerId, 
      amount: request.amount,
      reference: request.reference,
    });

    const response = await fetch(`${BASE_URL}/apply`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Loans: Application failed', { status: response.status, error });
      throw new Error(`Loan application failed: ${response.status}`);
    }

    const result: VFDResponse<LoanApplication> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Loan application failed');
    }

    logger.info('VFD Loans: Application successful', { loanId: result.data.loanId });
    return result.data;
  }

  /**
   * Get loan details
   */
  async getLoanDetails(loanId: string): Promise<LoanDetails> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/details?loanId=${encodeURIComponent(loanId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get loan details: ${response.status}`);
    }

    const result: VFDResponse<LoanDetails> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get loan details');
    }

    return result.data;
  }

  /**
   * Get loan history for a customer
   */
  async getLoanHistory(customerId: string): Promise<LoanHistory> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/history?customerId=${encodeURIComponent(customerId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get loan history: ${response.status}`);
    }

    const result: VFDResponse<LoanHistory> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get loan history');
    }

    return result.data;
  }

  /**
   * Repay a loan
   */
  async repayLoan(request: RepaymentRequest): Promise<RepaymentResponse> {
    const headers = await getVFDHeaders();

    logger.info('VFD Loans: Processing repayment', { 
      loanId: request.loanId, 
      amount: request.amount,
      reference: request.reference,
    });

    const response = await fetch(`${BASE_URL}/repay`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Loans: Repayment failed', { status: response.status, error });
      throw new Error(`Loan repayment failed: ${response.status}`);
    }

    const result: VFDResponse<RepaymentResponse> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Loan repayment failed');
    }

    logger.info('VFD Loans: Repayment successful', { reference: request.reference });
    return result.data;
  }

  /**
   * Get repayment schedule
   */
  async getRepaymentSchedule(loanId: string): Promise<RepaymentSchedule> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/schedule?loanId=${encodeURIComponent(loanId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get repayment schedule: ${response.status}`);
    }

    const result: VFDResponse<RepaymentSchedule> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get repayment schedule');
    }

    return result.data;
  }
}

export const vfdLoansService = new VFDLoansService();
