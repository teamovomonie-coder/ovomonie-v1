/**
 * Paystack payment helper for card funding in test mode.
 * Reference: https://paystack.com/docs/payments/accept-payments/
 */

const PAYSTACK_API_BASE = 'https://api.paystack.co';

function getSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

/**
 * Initialize a Paystack transaction for card funding.
 * Returns authorization_url for user to complete payment (or card details for direct charge).
 */
export async function initiatePaystackTransaction(payload: {
  amount: number; // in kobo (smallest unit)
  email: string;
  reference: string;
  metadata?: Record<string, any>;
}) {
  const secretKey = getSecretKey();
  if (!secretKey || secretKey.startsWith('sk_test_xxx')) {
    return {
      status: 400,
      ok: false,
      data: { message: 'Paystack secret key not configured (PAYSTACK_SECRET_KEY).' },
    };
  }

  const url = `${PAYSTACK_API_BASE}/transaction/initialize`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount: payload.amount,
        email: payload.email,
        reference: payload.reference,
        metadata: payload.metadata || {},
      }),
    });

    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return {
      status: 500,
      ok: false,
      data: { message: err instanceof Error ? err.message : 'Paystack request failed' },
    };
  }
}

/**
 * Verify a completed Paystack transaction.
 * Call this after user completes payment to confirm and get transaction details.
 */
export async function verifyPaystackTransaction(reference: string) {
  const secretKey = getSecretKey();
  if (!secretKey || secretKey.startsWith('sk_test_xxx')) {
    return {
      status: 400,
      ok: false,
      data: { message: 'Paystack secret key not configured.' },
    };
  }

  const url = `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return {
      status: 500,
      ok: false,
      data: { message: err instanceof Error ? err.message : 'Paystack verification failed' },
    };
  }
}

/**
 * Resolve bank account using Paystack API
 * Returns account name for a given bank code + account number
 */
export async function resolveBankAccount(accountNumber: string, bankCode: string) {
  const secretKey = getSecretKey();
  if (!secretKey || secretKey.startsWith('sk_test_xxx')) {
    return {
      status: 400,
      ok: false,
      data: { message: 'Paystack secret key not configured.' },
    };
  }
  const url = `${PAYSTACK_API_BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return {
      status: 500,
      ok: false,
      data: { message: err instanceof Error ? err.message : 'Paystack resolve failed' },
    };
  }
}

const paystackAPI = { initiatePaystackTransaction, verifyPaystackTransaction, resolveBankAccount };

export default paystackAPI;
