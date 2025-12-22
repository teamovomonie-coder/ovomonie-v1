export async function submitPurchase(payload: any): Promise<{ ok: boolean; transactionId?: string; message?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ovo-auth-token') : null;

  try {
    const res = await fetch('/api/payments/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.message || 'Payment failed' };
    }

    const data = await res.json();
    if (data?.ok && data?.transaction_id) {
      // clear any local pending receipt state for safety
      try {
        localStorage.removeItem('ovo-pending-receipt');
        window.dispatchEvent(new Event('ovo-pending-receipt-cleared'));
      } catch (e) {}

      return { ok: true, transactionId: data.transaction_id };
    }

    return { ok: false, message: data?.message || 'Unknown response' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Network error' };
  }
}
