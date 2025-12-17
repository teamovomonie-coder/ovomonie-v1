/**
 * VFD Payment Widget Integration
 * Based on: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/payment-widget
 */

const WIDGET_URL = 'https://widget-devapps.vfdbank.systems/payment';
const PUBLIC_KEY = process.env.VFD_CONSUMER_KEY; // Using consumer key as public key

export interface PaymentWidgetParams {
  amount: number; // in kobo
  email: string;
  reference: string;
  callbackUrl: string;
  customerName?: string;
  phone?: string;
}

/**
 * Generate VFD payment widget URL
 */
export function generatePaymentWidgetUrl(params: PaymentWidgetParams): string {
  if (!PUBLIC_KEY) {
    throw new Error('VFD public key not configured');
  }

  const url = new URL(WIDGET_URL);
  url.searchParams.set('publicKey', PUBLIC_KEY);
  url.searchParams.set('amount', params.amount.toString());
  url.searchParams.set('email', params.email);
  url.searchParams.set('reference', params.reference);
  url.searchParams.set('callbackUrl', params.callbackUrl);
  
  if (params.customerName) {
    url.searchParams.set('customerName', params.customerName);
  }
  
  if (params.phone) {
    url.searchParams.set('phone', params.phone);
  }

  return url.toString();
}

/**
 * Generate payment widget configuration for iframe embedding
 */
export function generateWidgetConfig(params: PaymentWidgetParams) {
  return {
    url: generatePaymentWidgetUrl(params),
    publicKey: PUBLIC_KEY,
    amount: params.amount,
    email: params.email,
    reference: params.reference,
    callbackUrl: params.callbackUrl,
  };
}
