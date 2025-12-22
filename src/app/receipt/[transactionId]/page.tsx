"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Tx = {
  id?: string;
  reference?: string;
  amount?: number;
  party_name?: string;
  party_account?: string;
  created_at?: string;
  status?: string;
  [key: string]: any;
};

export default function ReceiptPageClient() {
  const params = useParams() as { transactionId?: string };
  const router = useRouter();
  const transactionId = params?.transactionId;

  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<Tx | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setError('Missing transaction ID');
      setLoading(false);
      return;
    }

    const txId = transactionId as string;

    const token = typeof window !== 'undefined' ? localStorage.getItem('ovo-auth-token') : null;

    async function fetchTx() {
      setLoading(true);
      try {
        const res = await fetch(`/api/transactions/${encodeURIComponent(txId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.message || 'Transaction not found');
          setTx(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTx(data?.data || null);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch transaction');
      } finally {
        setLoading(false);
      }
    }

    fetchTx();
  }, [transactionId]);

  const handleTransferAgain = () => {
    router.push('/transfer');
  };

  const handleShare = async () => {
    if (!transactionId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('ovo-auth-token') : null;
    await fetch('/api/transactions/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ transactionId, channel: 'in-app' }),
    });
    // optimistic UX: show a small toast using browser alert (integrate with real toast in app later)
    try { alert('Receipt shared (notification sent)'); } catch (e) {}
  };

  if (loading) return <div className="p-6">Loading receipt…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!tx) return <div className="p-6">Transaction not found</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-600">✓ Payment Successful</h2>
      </div>

      <div className="bg-white shadow rounded p-4 mb-6">
        <div className="mb-2"><strong>Amount:</strong> ₦{(tx.amount ?? 0).toLocaleString()}</div>
        <div className="mb-2"><strong>Recipient:</strong> {tx.party_name || tx.recipient_name || '—'}</div>
        <div className="mb-2"><strong>Reference:</strong> {tx.reference || tx.id}</div>
        <div className="mb-2"><strong>Date:</strong> {tx.created_at ? new Date(tx.created_at).toLocaleString() : new Date().toLocaleString()}</div>
        <div className="mb-2"><strong>Status:</strong> {tx.status || 'completed'}</div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleTransferAgain} className="px-4 py-2 bg-blue-600 text-white rounded">Transfer Again</button>
        <button onClick={handleShare} className="px-4 py-2 bg-gray-100 rounded">Share Receipt</button>
        <button onClick={() => router.push('/support')} className="px-4 py-2 bg-transparent text-red-600 rounded">Report Issue</button>
      </div>
    </div>
  );
}
