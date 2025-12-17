/**
 * VFD Wallet API Client
 * Complete integration with VFD Wallet API
 * Documentation: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/wallets-api/
 */

const VFD_WALLET_TEST_BASE = 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';
const VFD_WALLET_LIVE_BASE = 'https://api-apps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

function getWalletBase(): string {
  return process.env.VFD_WALLET_API_BASE || VFD_WALLET_TEST_BASE;
}

function getAccessToken(): string | null {
  const token = process.env.VFD_ACCESS_TOKEN?.trim();
  if (token && token.length > 20) {
    return token;
  }
  return null;
}

function getHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('VFD_ACCESS_TOKEN not configured');
  }
  return {
    'AccessToken': token,
    'Content-Type': 'application/json',
  };
}

// ============= Types =============

export interface AccountDetails {
  accountNo: string;
  accountBalance: string;
  accountId: string;
  client: string;
  clientId: string;
  savingsProductName: string;
}

export interface Bank {
  id: number;
  code: string;
  name: string;
  logo: string;
  created: string;
}

export interface TransferRecipient {
  name: string;
  clientId: string;
  bvn: string;
  account: {
    number: string;
    id: string;
  };
  status: string;
  currency: string;
  bank: string;
}

export interface VirtualAccountRequest {
  amount: string;
  merchantName: string;
  merchantId: string;
  reference: string;
  validityTime?: string; // in minutes, default 4320, max 4320
  amountValidation?: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
}

export interface VirtualAccountResponse {
  status: string;
  message: string;
  accountNumber?: string;
  reference?: string;
}

export interface TransferRequest {
  fromAccount: string;
  fromClientId: string;
  fromClient: string;
  fromSavingsId: string;
  fromBvn?: string;
  toClientId?: string;
  toClient: string;
  toSavingsId?: string;
  toSession?: string;
  toBvn?: string;
  toAccount: string;
  toBank: string;
  signature: string;
  amount: string;
  remark: string;
  transferType: 'intra' | 'inter';
  reference: string;
  uniqueSenderAccountId?: string;
}

export interface TransferResponse {
  status: string;
  message: string;
  data?: {
    txnId: string;
    sessionId?: string;
    reference?: string;
  };
}

export interface TransactionStatusResponse {
  status: string;
  message: string;
  data?: {
    TxnId: string;
    amount: string;
    accountNo: string;
    fromAccountNo: string;
    transactionStatus: string;
    transactionDate: string;
    toBank: string;
    fromBank: string;
    sessionId: string;
    bankTransactionId: string;
    transactionType: string;
  };
}

export interface AccountTransaction {
  accountNo: string;
  receiptNumber: string;
  amount: string;
  remarks: string;
  createdDate: string;
  transactionType: 'CREDIT' | 'DEBIT';
  runningBalance: string;
  currencyCode: string;
  id: string;
}

export interface CreditRequest {
  amount: string;
  accountNo: string;
  senderAccountNo: string;
  senderBank: string;
  senderNarration: string;
}

// ============= API Functions =============

/**
 * Get pool account details or a specific account's details
 */
export async function getAccountEnquiry(accountNumber?: string): Promise<{
  ok: boolean;
  data?: AccountDetails;
  message?: string;
}> {
  try {
    const url = accountNumber 
      ? `${getWalletBase()}/account/enquiry?accountNumber=${accountNumber}`
      : `${getWalletBase()}/account/enquiry`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json();
    
    if (result.status === '00') {
      return { ok: true, data: result.data };
    }
    
    return { ok: false, message: result.message || 'Failed to get account details' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get list of all Nigerian banks
 */
export async function getBankList(): Promise<{
  ok: boolean;
  data?: Bank[];
  message?: string;
}> {
  try {
    const response = await fetch(`${getWalletBase()}/bank`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json();
    
    if (result.status === '00' && result.data?.bank) {
      return { ok: true, data: result.data.bank };
    }
    
    return { ok: false, message: result.message || 'Failed to get bank list' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get transfer recipient details (name enquiry)
 */
export async function getTransferRecipient(
  accountNo: string,
  bankCode: string,
  transferType: 'intra' | 'inter'
): Promise<{
  ok: boolean;
  data?: TransferRecipient;
  message?: string;
}> {
  try {
    const url = `${getWalletBase()}/transfer/recipient?accountNo=${accountNo}&bank=${bankCode}&transfer_type=${transferType}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json();
    
    if (result.status === '00') {
      return { ok: true, data: result.data };
    }
    
    return { ok: false, message: result.message || 'Account not found' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a one-time virtual account for bank transfer funding
 * amountValidation options:
 * - A0: Only exact amount
 * - A1: Only less than amount
 * - A2: Only greater than amount  
 * - A3: Equal or less than amount
 * - A4: Equal or greater than amount (default)
 * - A5: Any amount
 */
export async function createVirtualAccount(
  request: VirtualAccountRequest
): Promise<VirtualAccountResponse> {
  try {
    const response = await fetch(`${getWalletBase()}/virtualaccount`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      status: '99',
      message: error instanceof Error ? error.message : 'Failed to create virtual account',
    };
  }
}

/**
 * Update amount on an existing virtual account
 */
export async function updateVirtualAccountAmount(
  reference: string,
  amount: string
): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${getWalletBase()}/virtualaccount/amountupdate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reference, amount }),
    });

    return await response.json();
  } catch (error) {
    return {
      status: '99',
      message: error instanceof Error ? error.message : 'Failed to update virtual account',
    };
  }
}

/**
 * Initiate a funds transfer
 */
export async function initiateTransfer(
  request: TransferRequest
): Promise<TransferResponse> {
  try {
    const response = await fetch(`${getWalletBase()}/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    return await response.json();
  } catch (error) {
    return {
      status: '99',
      message: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
}

/**
 * Get transaction status by reference or sessionId
 */
export async function getTransactionStatus(
  identifier: { reference?: string; sessionId?: string }
): Promise<TransactionStatusResponse> {
  try {
    const params = identifier.reference 
      ? `reference=${identifier.reference}`
      : `sessionId=${identifier.sessionId}`;
    
    const response = await fetch(`${getWalletBase()}/transactions?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await response.json();
  } catch (error) {
    return {
      status: '99',
      message: error instanceof Error ? error.message : 'Failed to get transaction status',
    };
  }
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(
  accountNo: string,
  startDate: string, // e.g., '2024-01-01 00:00:00'
  endDate: string,   // e.g., '2024-12-31 23:59:59'
  transactionType: 'wallet' | 'bank' = 'wallet',
  page: number = 0,
  size: number = 20
): Promise<{
  ok: boolean;
  data?: {
    content: AccountTransaction[];
    totalElements: number;
    totalPages: number;
  };
  message?: string;
}> {
  try {
    const url = `${getWalletBase()}/account/transactions?accountNo=${accountNo}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&transactionType=${transactionType}&page=${page}&size=${size}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json();
    
    if (result.status === '00') {
      return { ok: true, data: result.data };
    }
    
    return { ok: false, message: result.message || 'Failed to get transactions' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Simulate an inward credit (DEV ENVIRONMENT ONLY)
 * Use for testing bank transfer flows
 */
export async function simulateCredit(request: CreditRequest): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${getWalletBase()}/credit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    const result = await response.json();
    
    return {
      ok: result.status === '00',
      message: result.message || 'Unknown response',
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to simulate credit',
    };
  }
}

/**
 * Get virtual account transaction history
 */
export async function getVirtualAccountTransactions(
  accountNumber: string,
  startDate: string,
  endDate: string,
  page: number = 0,
  size: number = 20
): Promise<{
  ok: boolean;
  data?: {
    content: any[];
    totalElements: number;
    totalPages: number;
  };
  message?: string;
}> {
  try {
    const url = `${getWalletBase()}/virtualaccount/transactions?accountNumber=${accountNumber}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&page=${page}&size=${size}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json();
    
    if (result.status === '00') {
      return { ok: true, data: result.data };
    }
    
    return { ok: false, message: result.message || 'Failed to get virtual account transactions' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Retrigger webhook notification for a transaction
 */
export async function retriggerWebhook(
  identifier: { transactionId?: string; sessionId?: string },
  pushIdentifier: 'transactionId' | 'sessionId'
): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${getWalletBase()}/transactions/repush`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        transactionId: identifier.transactionId || '',
        sessionId: identifier.sessionId || '',
        pushIdentifier,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      status: '99',
      message: error instanceof Error ? error.message : 'Failed to retrigger webhook',
    };
  }
}

// Export a singleton instance
const vfdWalletAPI = {
  getAccountEnquiry,
  getBankList,
  getTransferRecipient,
  createVirtualAccount,
  updateVirtualAccountAmount,
  initiateTransfer,
  getTransactionStatus,
  getAccountTransactions,
  getVirtualAccountTransactions,
  simulateCredit,
  retriggerWebhook,
};

export default vfdWalletAPI;
