"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MemoReceipt from '@/components/memo-transfer/memo-receipt';
import GeneralReceipt from '@/components/transaction/general-receipt';
import { BettingReceipt } from '@/components/betting/betting-receipt';
import { AirtimeReceipt } from '@/components/airtime/airtime-receipt';
import { BillPaymentReceipt } from '@/components/bill-payment/bill-payment-receipt';
import VirtualCardReceipt from '@/components/custom-card/virtual-card-receipt';
import { pendingTransactionService } from '@/lib/pending-transaction-service';

type ReceiptStore = {
  transactionId: string | undefined;
  type?: string;
  data: any;
  recipientName?: string;
  completedAt?: string;
  bankName?: string;
  reference?: string;
};

export default function SuccessPage() {
  const router = useRouter();
  const [pending, setPending] = useState<ReceiptStore | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch pending receipt from database first, with localStorage fallback
  const fetchPendingReceipt = useCallback(async () => {
    try {
      // Try database first
      const dbReceipt = await pendingTransactionService.getLatest();
      if (dbReceipt && dbReceipt.type && dbReceipt.data) {
        // Convert service receipt format to component format
        const converted: ReceiptStore = {
          transactionId: dbReceipt.transactionId || dbReceipt.reference,
          type: dbReceipt.type,
          data: dbReceipt.data || dbReceipt,
          recipientName: dbReceipt.recipientName,
          completedAt: dbReceipt.completedAt as string,
          bankName: dbReceipt.bankName,
          reference: dbReceipt.reference,
        };
        setPending(converted);
        return;
      }
    } catch (error) {
      console.debug('[SuccessPage] Database fetch failed, trying localStorage', error);
    }

    // Fallback to localStorage
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
  }, []);

  useEffect(() => {
    fetchPendingReceipt().finally(() => setIsLoaded(true));
  }, [fetchPendingReceipt]);

  useEffect(() => {
    const handler = () => {
      fetchPendingReceipt();
    };

    window.addEventListener('ovo-pending-receipt-updated', handler);
    return () => {
      window.removeEventListener('ovo-pending-receipt-updated', handler);
    };
  }, [fetchPendingReceipt]);

  const handleReset = useCallback(async () => {
    // Clear from database if reference exists
    if (pending?.reference) {
      await pendingTransactionService.deletePending(pending.reference);
    }
    // Also clear localStorage for compatibility
    try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {}
    router.push('/dashboard');
  }, [pending?.reference, router]);

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
          <MemoReceipt data={pending.data} recipientName={pending.recipientName} onReset={handleReset} transactionId={pending.transactionId} date={pending.completedAt || pending.data?.date} isInternalTransfer={pending.data?.isInternalTransfer} />
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

      if (pending.type === 'virtual-card') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <VirtualCardReceipt
              data={pending.data}
              transactionId={pending.transactionId}
              onReset={handleReset}
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
