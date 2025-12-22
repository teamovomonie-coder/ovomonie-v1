/**
 * VFD Wallet Service - Core Banking Infrastructure
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/wallets-api
 */

import { getVFDHeaders } from './vfd-auth';
import { logger } from './logger';

const BASE_URL = process.env.VFD_WALLET_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

export interface BankAccountVerificationRequest {
  accountNumber: string;
  bankCode: string;
}

export interface BankAccountVerificationResult {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName?: string;
}

interface VFDResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface CreateWalletRequest {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  bvn?: string;
}

export interface Wallet {
  walletId: string;
  customerId: string;
  accountNumber: string;
  balance: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}

export interface WalletTransferRequest {
  sourceWalletId: string;
  destinationWalletId: string;
  amount: string;
  reference: string;
  narration: string;
}

export interface BankTransferRequest {
  walletId: string;
  accountNumber: string;
  bankCode: string;
  amount: string;
  reference: string;
  narration: string;
}

export interface BankListResponse {
  banks: Array<{
    code: string;
    name: string;
  }>;
}

export interface Transaction {
  transactionId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: string;
  balance: string;
  narration: string;
  reference: string;
  date: string;
}

export interface AccountUpgradeRequest {
  accountNumber: string;
  bvn: string;
}

export interface AMLVerificationRequest {
  accountNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality?: string;
}

export interface AMLVerificationResult {
  status: 'CLEAR' | 'FLAGGED' | 'PENDING';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matches: Array<{
    name: string;
    type: 'PEP' | 'SANCTION' | 'ADVERSE_MEDIA';
    confidence: number;
  }>;
  verificationDate: string;
}

export interface ImageMatchRequest {
  accountNumber: string;
  selfieImage: string; // Base64 encoded image
  idCardImage: string; // Base64 encoded image
}

export interface ImageMatchResult {
  match: boolean;
  confidence: number; // 0-100
  verificationDate: string;
}

export interface LivenessCheckRequest {
  accountNumber: string;
  videoFrames: string[]; // Array of base64 encoded video frames
}

export interface LivenessCheckResult {
  isLive: boolean;
  confidence: number; // 0-100
  verificationDate: string;
}

export interface NINVerificationRequest {
  accountNumber: string;
  nin: string; // 11-digit NIN
}

export interface NINVerificationResult {
  verified: boolean;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  photo?: string; // Base64 encoded photo
}

class VFDWalletService {
  /**
   * Create a new wallet for a customer
   */
  async createWallet(request: CreateWalletRequest): Promise<Wallet> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Creating wallet', { customerId: request.customerId });

    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: Creation failed', { status: response.status, error });
      throw new Error(`Wallet creation failed: ${response.status}`);
    }

    const result: VFDResponse<Wallet> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Wallet creation failed');
    }

    logger.info('VFD Wallet: Created successfully', { walletId: result.data.walletId });
    return result.data;
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId: string): Promise<string> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/balance?walletId=${encodeURIComponent(walletId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get balance: ${response.status}`);
    }

    const result: VFDResponse<{ balance: string }> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get balance');
    }

    return result.data.balance;
  }

  /**
   * Get wallet details
   */
  async getWalletDetails(walletId: string): Promise<Wallet> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/details?walletId=${encodeURIComponent(walletId)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get wallet details: ${response.status}`);
    }

    const result: VFDResponse<Wallet> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get wallet details');
    }

    return result.data;
  }

  /**
   * Transfer between wallets (internal transfer)
   */
  async walletToWalletTransfer(request: WalletTransferRequest): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Wallet-to-wallet transfer', { reference: request.reference });

    const response = await fetch(`${BASE_URL}/transfer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: Transfer failed', { status: response.status, error });
      throw new Error(`Transfer failed: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Transfer failed');
    }

    logger.info('VFD Wallet: Transfer successful', { reference: request.reference });
  }

  /**
   * Withdraw to bank account (external transfer)
   */
  async withdrawToBank(request: BankTransferRequest): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Bank withdrawal', { reference: request.reference });

    const response = await fetch(`${BASE_URL}/withdraw`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const responseText = await response.text();
    logger.info('VFD Wallet: Withdrawal raw response', { 
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 500) // Log first 500 chars
    });

    if (!response.ok) {
      logger.error('VFD Wallet: Withdrawal failed', { 
        status: response.status, 
        statusText: response.statusText,
        error: responseText 
      });
      throw new Error(`Withdrawal failed: ${response.status} ${response.statusText}`);
    }

    if (!responseText.trim()) {
      logger.error('VFD Wallet: Empty response from withdrawal API');
      throw new Error('Empty response from VFD withdrawal API');
    }

    let result: VFDResponse<any>;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      logger.error('VFD Wallet: Invalid JSON response from withdrawal', { 
        responseText: responseText.substring(0, 200),
        parseError: e instanceof Error ? e.message : 'Unknown parse error'
      });
      throw new Error('Invalid response from VFD withdrawal API');
    }

    if (result.status !== '00') {
      logger.error('VFD Wallet: Withdrawal API returned error status', { 
        status: result.status, 
        message: result.message 
      });
      throw new Error(result.message || 'Withdrawal failed');
    }

    logger.info('VFD Wallet: Withdrawal successful', { reference: request.reference });
  }

  /**
   * Get transaction history
   */
  async getTransactions(walletId: string, limit = 50): Promise<Transaction[]> {
    const headers = await getVFDHeaders();

    const response = await fetch(`${BASE_URL}/transactions?walletId=${encodeURIComponent(walletId)}&limit=${limit}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.status}`);
    }

    const result: VFDResponse<{ transactions: Transaction[] }> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to get transactions');
    }

    return result.data.transactions || [];
  }

  /**
   * Freeze wallet
   */
  async freezeWallet(walletId: string, reason: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Freezing wallet', { walletId });

    const response = await fetch(`${BASE_URL}/freeze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ walletId, reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to freeze wallet: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to freeze wallet');
    }

    logger.info('VFD Wallet: Frozen successfully', { walletId });
  }

  /**
   * Unfreeze wallet
   */
  async unfreezeWallet(walletId: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Unfreezing wallet', { walletId });

    const response = await fetch(`${BASE_URL}/unfreeze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ walletId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unfreeze wallet: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to unfreeze wallet');
    }

    logger.info('VFD Wallet: Unfrozen successfully', { walletId });
  }

  /**
   * Upgrade account using BVN (KYC Tier Upgrade)
   * Verifies BVN and removes PND status
   */
  async upgradeAccountWithBVN(accountNumber: string, bvn: string): Promise<void> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Upgrading account with BVN', { accountNumber });

    const response = await fetch(`${BASE_URL}/client/upgrade`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accountNumber, bvn }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: Account upgrade failed', { status: response.status, error });
      throw new Error(`Account upgrade failed: ${response.status}`);
    }

    const result: VFDResponse<any> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Account upgrade failed');
    }

    logger.info('VFD Wallet: Account upgraded successfully', { accountNumber });
  }

  /**
   * AML Verification - Screen customer against PEP, sanctions, and adverse media lists
   * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/KYC/aml-verification
   */
  async verifyAML(request: AMLVerificationRequest): Promise<AMLVerificationResult> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: AML verification', { accountNumber: request.accountNumber });

    const response = await fetch(`${BASE_URL}/kyc/aml/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: AML verification failed', { status: response.status, error });
      throw new Error(`AML verification failed: ${response.status}`);
    }

    const result: VFDResponse<AMLVerificationResult> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'AML verification failed');
    }

    logger.info('VFD Wallet: AML verification complete', { 
      accountNumber: request.accountNumber,
      status: result.data.status,
      riskLevel: result.data.riskLevel
    });

    return result.data;
  }

  /**
   * Image Match - Compare selfie with ID card photo for identity verification
   * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/KYC/imagematch
   */
  async verifyImageMatch(request: ImageMatchRequest): Promise<ImageMatchResult> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Image match verification', { accountNumber: request.accountNumber });

    const response = await fetch(`${BASE_URL}/kyc/image/match`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: Image match failed', { status: response.status, error });
      throw new Error(`Image match failed: ${response.status}`);
    }

    const result: VFDResponse<ImageMatchResult> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Image match failed');
    }

    logger.info('VFD Wallet: Image match complete', { 
      accountNumber: request.accountNumber,
      match: result.data.match,
      confidence: result.data.confidence
    });

    return result.data;
  }

  /**
   * Liveness Check - Detect if user is physically present (anti-spoofing)
   * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/KYC/livenesscheck
   */
  async verifyLiveness(request: LivenessCheckRequest): Promise<LivenessCheckResult> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Liveness check', { accountNumber: request.accountNumber });

    const response = await fetch(`${BASE_URL}/kyc/liveness/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: Liveness check failed', { status: response.status, error });
      throw new Error(`Liveness check failed: ${response.status}`);
    }

    const result: VFDResponse<LivenessCheckResult> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'Liveness check failed');
    }

    logger.info('VFD Wallet: Liveness check complete', { 
      accountNumber: request.accountNumber,
      isLive: result.data.isLive,
      confidence: result.data.confidence
    });

    return result.data;
  }

  /**
   * NIN Verification - Verify National Identity Number and retrieve user details
   * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/KYC/nin-api
   */
  async verifyNIN(request: NINVerificationRequest): Promise<NINVerificationResult> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: NIN verification', { accountNumber: request.accountNumber });

    const response = await fetch(`${BASE_URL}/kyc/nin/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VFD Wallet: NIN verification failed', { status: response.status, error });
      throw new Error(`NIN verification failed: ${response.status}`);
    }

    const result: VFDResponse<NINVerificationResult> = await response.json();

    if (result.status !== '00') {
      throw new Error(result.message || 'NIN verification failed');
    }

    logger.info('VFD Wallet: NIN verification complete', { 
      accountNumber: request.accountNumber,
      verified: result.data.verified
    });

    return result.data;
  }

  /**
   * Verify bank account details
   */
  async verifyBankAccount(request: BankAccountVerificationRequest): Promise<BankAccountVerificationResult> {
    const headers = await getVFDHeaders();

    logger.info('VFD Wallet: Bank account verification', { accountNumber: request.accountNumber, bankCode: request.bankCode });

    const response = await fetch(`${BASE_URL}/transfer/verify-account`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const responseText = await response.text();
    logger.info('VFD Wallet: Raw response', { 
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 500) // Log first 500 chars
    });

    if (!response.ok) {
      logger.error('VFD Wallet: Account verification failed', { 
        status: response.status, 
        statusText: response.statusText,
        error: responseText 
      });
      throw new Error(`Account verification failed: ${response.status} ${response.statusText}`);
    }

    if (!responseText.trim()) {
      logger.error('VFD Wallet: Empty response from API');
      throw new Error('Empty response from VFD API');
    }

    let result: VFDResponse<BankAccountVerificationResult>;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      logger.error('VFD Wallet: Invalid JSON response', { 
        responseText: responseText.substring(0, 200),
        parseError: e instanceof Error ? e.message : 'Unknown parse error'
      });
      throw new Error('Invalid response from VFD API');
    }

    if (result.status !== '00') {
      logger.error('VFD Wallet: API returned error status', { 
        status: result.status, 
        message: result.message 
      });
      throw new Error(result.message || 'Account verification failed');
    }

    logger.info('VFD Wallet: Account verified', { accountName: result.data.accountName });
    return result.data;
  }
}

export const vfdWalletService = new VFDWalletService();
