/**
 * Unified VFD API Helper
 * Standardizes all VFD API calls across the application
 */

// VFD API Base URLs
const VFD_BASES = {
  cards: process.env.VFD_CARDS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards',
  wallet: process.env.VFD_WALLET_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2',
  bills: process.env.VFD_BILLS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore',
  loans: process.env.VFD_LOANS_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2',
  kyc: process.env.VFD_KYC_AML_API_BASE || 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2'
};

// Get VFD headers with proper authentication
function getVFDHeaders(): Record<string, string> {
  const token = process.env.VFD_ACCESS_TOKEN;
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token && token.length > 20 && !token.includes('your_')) {
    headers.AccessToken = token;
  } else if (key && secret) {
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  } else {
    // In development, allow requests without auth for testing
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('VFD credentials not configured');
    }
  }
  
  return headers;
}

// Generic VFD API call
async function vfdRequest(
  service: keyof typeof VFD_BASES,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', body, params } = options;
  const baseUrl = VFD_BASES[service];
  
  let url = `${baseUrl}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  const config: RequestInit = {
    method,
    headers: getVFDHeaders(),
  };
  
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));
  
  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

// Specific VFD API functions
export const vfdAPI = {
  // Cards API
  cards: {
    initiate: (payload: any) => vfdRequest('cards', '/initiate/payment', { method: 'POST', body: payload }),
    validateOTP: (payload: any) => vfdRequest('cards', '/validate-otp', { method: 'POST', body: payload }),
    authorizeOTP: (payload: any) => vfdRequest('cards', '/authorize-otp', { method: 'POST', body: payload }),
    authorizePin: (payload: any) => vfdRequest('cards', '/authorize-pin', { method: 'POST', body: payload }),
    getStatus: (reference: string) => vfdRequest('cards', '/payment-details', { params: { reference } }),
  },
  
  // Wallet API
  wallet: {
    getAccount: (accountNumber?: string) => vfdRequest('wallet', '/account/enquiry', { 
      params: accountNumber ? { accountNumber } : {} 
    }),
    getBanks: () => vfdRequest('wallet', '/bank'),
    getRecipient: (accountNo: string, bankCode: string, transferType: 'intra' | 'inter') => 
      vfdRequest('wallet', '/transfer/recipient', { params: { accountNo, bank: bankCode, transfer_type: transferType } }),
    transfer: (payload: any) => vfdRequest('wallet', '/transfer', { method: 'POST', body: payload }),
    withdrawToBank: (payload: any) => vfdRequest('wallet', '/transfer', { method: 'POST', body: payload }),
    verifyBankAccount: (accountNo: string, bankCode: string) => 
      vfdRequest('wallet', '/transfer/recipient', { params: { accountNo, bank: bankCode, transfer_type: 'inter' } }),
    getTransactions: (accountNo: string, startDate: string, endDate: string) => 
      vfdRequest('wallet', '/account/transactions', { params: { accountNo, startDate, endDate } }),
    createVirtualAccount: (payload: any) => vfdRequest('wallet', '/virtualaccount', { method: 'POST', body: payload }),
    credit: (payload: any) => vfdRequest('wallet', '/credit', { method: 'POST', body: payload }),
  },
  
  // Bills API
  bills: {
    getProviders: () => vfdRequest('bills', '/providers'),
    getServices: (providerId: string) => vfdRequest('bills', `/providers/${providerId}/services`),
    validateCustomer: (payload: any) => vfdRequest('bills', '/validate', { method: 'POST', body: payload }),
    payBill: (payload: any) => vfdRequest('bills', '/pay', { method: 'POST', body: payload }),
    getStatus: (reference: string) => vfdRequest('bills', '/status', { params: { reference } }),
  },
  
  // Loans API
  loans: {
    apply: (payload: any) => vfdRequest('loans', '/loans/apply', { method: 'POST', body: payload }),
    getLoans: (userId: string) => vfdRequest('loans', '/loans', { params: { userId } }),
    repay: (payload: any) => vfdRequest('loans', '/loans/repay', { method: 'POST', body: payload }),
  },
  
  // KYC API
  kyc: {
    verifyNIN: (payload: any) => vfdRequest('kyc', '/kyc/nin', { method: 'POST', body: payload }),
    verifyBVN: (payload: any) => vfdRequest('kyc', '/kyc/bvn', { method: 'POST', body: payload }),
    liveness: (payload: any) => vfdRequest('kyc', '/kyc/liveness', { method: 'POST', body: payload }),
    imageMatch: (payload: any) => vfdRequest('kyc', '/kyc/imagematch', { method: 'POST', body: payload }),
  }
};

export default vfdAPI;