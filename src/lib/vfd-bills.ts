/**
 * VFD Bills Payment API Client
 * Complete integration with VFD Bills Payment API
 * Documentation: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/bills-payment-api/
 */

const VFD_BILLS_TEST_BASE = 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';
const VFD_BILLS_LIVE_BASE = 'https://api-apps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';

function getBillsBase() {
  return process.env.VFD_BILLS_API_BASE || VFD_BILLS_TEST_BASE;
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  // If explicit token provided via env, use it
  if (process.env.VFD_ACCESS_TOKEN && process.env.VFD_ACCESS_TOKEN.trim()) {
    return process.env.VFD_ACCESS_TOKEN.trim();
  }

  // If we have a cached token and it's not expired, return it
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5000) {
    return cachedToken.token;
  }

  // Attempt client credentials exchange
  const key = process.env.VFD_CONSUMER_KEY;
  const secret = process.env.VFD_CONSUMER_SECRET;
  const tokenUrl = process.env.VFD_TOKEN_URL || 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1/baasauth/token';

  if (!key || !secret) {
    console.error('[VFD Bills] Missing VFD credentials');
    return null;
  }

  try {
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await res.json();
    const token = data?.access_token || data?.AccessToken || data?.token || data?.accessToken;
    const expiresIn = Number(data?.expires_in || data?.expires || 900); // default 15 minutes

    if (token) {
      const expiresAt = Date.now() + expiresIn * 1000;
      cachedToken = { token, expiresAt };
      return token;
    }

    console.error('[VFD Bills] Failed to get access token:', data);
    return null;
  } catch (error) {
    console.error('[VFD Bills] Error getting access token:', error);
    return null;
  }
}

// Types
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
  billerid: string;
  amount: string;
  code: string;
  paymentitemname: string;
  productId: string;
  paymentitemid: string;
  currencySymbol: string;
  isAmountFixed: string;
  itemFee: string;
  itemCurrencySymbol: string;
  pictureId?: string;
  paymentCode: string;
  sortOrder?: string;
  billerType: string;
  payDirectitemCode: string;
  currencyCode: string;
  division: string;
  categoryid: string;
}

export interface CustomerValidationResponse {
  status: string;
  message: string;
  data: Record<string, any>;
}

export interface BillPaymentRequest {
  customerId: string; // Phone number or meter number
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
  data: {
    reference: string;
    token?: string; // For electricity payments
    KCT1?: string; // For AEDC
    KCT2?: string; // For AEDC
  };
}

export interface TransactionStatusResponse {
  status: string;
  message: string;
  data: {
    transactionStatus: string;
    amount: string;
    token?: string;
  };
}

class VFDBillsAPI {
  /**
   * Get all biller categories
   * Endpoint: GET /billercategory
   */
  async getBillerCategories(): Promise<BillerCategory[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const response = await fetch(`${getBillsBase()}/billercategory`, {
      method: 'GET',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to fetch biller categories');
    }

    return result.data || [];
  }

  /**
   * Get billers for a category
   * Endpoint: GET /billerlist?categoryName={categoryName}
   */
  async getBillerList(categoryName?: string): Promise<Biller[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const url = categoryName 
      ? `${getBillsBase()}/billerlist?categoryName=${encodeURIComponent(categoryName)}`
      : `${getBillsBase()}/billerlist`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to fetch biller list');
    }

    return result.data || [];
  }

  /**
   * Get items for a biller
   * Endpoint: GET /billerItems?billerId={billerId}&divisionId={divisionId}&productId={productId}
   */
  async getBillerItems(billerId: string, divisionId: string, productId: string): Promise<BillerItem[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const url = `${getBillsBase()}/billerItems?billerId=${billerId}&divisionId=${divisionId}&productId=${productId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.status !== '00') {
      throw new Error(result.message || 'Failed to fetch biller items');
    }

    return result.data?.paymentitems || [];
  }

  /**
   * Validate customer ID (meter number, etc.)
   * Endpoint: GET /customervalidate?divisionId={divisionId}&paymentItem={paymentItem}&customerId={customerId}&billerId={billerId}
   * Note: Required for utility, cable TV, betting, and gaming. Optional for airtime and data.
   */
  async validateCustomer(
    customerId: string,
    divisionId: string,
    paymentItem: string,
    billerId: string
  ): Promise<CustomerValidationResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const url = `${getBillsBase()}/customervalidate?divisionId=${divisionId}&paymentItem=${paymentItem}&customerId=${encodeURIComponent(customerId)}&billerId=${billerId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  }

  /**
   * Pay bill
   * Endpoint: POST /pay
   */
  async payBill(request: BillPaymentRequest): Promise<BillPaymentResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    console.log('[VFD Bills] Initiating payment:', { reference: request.reference, amount: request.amount });

    const response = await fetch(`${getBillsBase()}/pay`, {
      method: 'POST',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    
    console.log('[VFD Bills] Payment response:', result);

    if (result.status === '00') {
      return result;
    } else if (result.status === '09') {
      // Pending status
      return result;
    } else {
      throw new Error(result.message || 'Payment failed');
    }
  }

  /**
   * Check transaction status
   * Endpoint: GET /transactionStatus?transactionId={transactionId}
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const url = `${getBillsBase()}/transactionStatus?transactionId=${encodeURIComponent(transactionId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.status === '108') {
      throw new Error('Transaction not found');
    }

    return result;
  }
}

// Export singleton instance
const vfdBillsAPI = new VFDBillsAPI();
export default vfdBillsAPI;
