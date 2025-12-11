"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MemoReceipt from '@/components/memo-transfer/memo-receipt';
import GeneralReceipt from '@/components/transaction/general-receipt';
import { BettingReceipt } from '@/components/betting/betting-receipt';
import { AirtimeReceipt } from '@/components/airtime/airtime-receipt';
import { BillPaymentReceipt } from '@/components/bill-payment/bill-payment-receipt';

type ReceiptStore = {
  transactionId: string | undefined;
  type?: string;
  data: any;
  recipientName?: string;
  completedAt?: string;
  bankName?: string;
};

export default function SuccessPage() {
  const router = useRouter();
  const [pending, setPending] = useState<ReceiptStore | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ovo-pending-receipt');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ReceiptStore;
          // Basic validation: must be an object with a type and data
          if (parsed && typeof parsed === 'object' && ('type' in parsed) && ('data' in parsed)) {
            setPending(parsed);
          } else {
            console.error('[SuccessPage] Invalid pending receipt shape', parsed, raw);
            setPending(null);
          }
        } catch (e) {
          console.error('[SuccessPage] Failed to parse ovo-pending-receipt', e, raw);
          // Remove corrupt value so users don't get stuck
          try { localStorage.removeItem('ovo-pending-receipt'); } catch (_) {}
          setPending(null);
        }
      } else {
        setPending(null);
      }
    } catch (e) {
      setPending(null);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem('ovo-pending-receipt');
        if (raw) setPending(JSON.parse(raw));
        else setPending(null);
      } catch (e) {
        setPending(null);
      }
    };

    window.addEventListener('ovo-pending-receipt-updated', handler);
    return () => {
      window.removeEventListener('ovo-pending-receipt-updated', handler);
    };
  }, []);

  const handleReset = () => {
    try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {}
    router.push('/dashboard');
  };

  // If there is no pending receipt AFTER loading, redirect back to dashboard.
  // Wait until isLoaded is true so we don't redirect prematurely on mount.
  useEffect(() => {
    if (isLoaded && pending === null) {
      try { router.replace('/dashboard'); } catch (e) { /* ignore */ }
    }
  }, [isLoaded, pending, router]);

  if (!isLoaded) return null;

  if (pending && pending.data) {
    // Debug: log the pending receipt for troubleshooting
    console.debug('[SuccessPage] pending receipt', pending);
    if (pending.type === 'memo-transfer' && pending.recipientName) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <MemoReceipt data={pending.data} recipientName={pending.recipientName} onReset={handleReset} transactionId={pending.transactionId} date={pending.completedAt || pending.data?.date} />
        </div>
      );
    }

    if (pending.type === 'betting') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <BettingReceipt
            data={{
              type: 'betting',
              platform: pending.data?.platform,
              accountId: pending.data?.accountId,
              amount: pending.data?.amount,
              recipientName: pending.recipientName,
              transactionId: pending.transactionId || pending.data?.transactionId,
              completedAt: pending.completedAt,
            }}
          />
        </div>
      );
    }

    if (pending.type === 'airtime') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <AirtimeReceipt
            data={{
              type: 'airtime',
              network: pending.data?.network,
              phoneNumber: pending.data?.phoneNumber,
              amount: pending.data?.amount,
              planName: pending.data?.planName,
              transactionId: pending.transactionId || pending.data?.transactionId,
              completedAt: pending.completedAt,
            }}
          />
        </div>
      );
    }

    if (pending.type === 'bill-payment') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <BillPaymentReceipt
            data={{
              type: 'bill-payment',
              biller: pending.data?.biller,
              amount: pending.data?.amount,
              accountId: pending.data?.accountId,
              verifiedName: pending.data?.verifiedName,
              bouquet: pending.data?.bouquet,
              transactionId: pending.transactionId,
              completedAt: pending.completedAt,
            }}
          />
        </div>
      );
    }

    // Always show a general receipt if any pending receipt exists
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GeneralReceipt
          title={(pending.type === 'external-transfer' ? 'External Transfer' : pending.data && pending.data.typeName) || 'Transaction'}
          amount={pending.data?.amount || 0}
          recipient={pending.recipientName || pending.data?.recipient}
          accountInfo={pending.data?.accountNumber || ''}
          transactionId={pending.transactionId || pending.data?.transactionId || `OVO-${Date.now()}`}
          paymentMethod={pending.bankName || pending.data?.paymentMethod || pending.data?.method}
          date={pending.completedAt || pending.data?.date || new Date().toLocaleString()}
          onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
        />
      </div>
    );
  }

  // While redirecting, render nothing (or a minimal loader). The redirect
  // will take the user back to the dashboard when there's no pending receipt.
  return null;
}
