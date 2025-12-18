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
import { DynamicReceipt } from '@/components/bill-payment/dynamic-receipt';
import VirtualCardReceipt from '@/components/custom-card/virtual-card-receipt';
import { pendingTransactionService } from '@/lib/pending-transaction-service';
import { receiptTemplateService } from '@/lib/receipt-templates';

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
      const receipt = {
        template: {
          id: 'betting-default',
          category: 'betting',
          template_name: 'Betting Wallet Receipt',
          fields: ['accountId', 'walletBalance'],
          color_scheme: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5' },
          icon: 'trophy',
        },
        data: pending.data,
      };
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <DynamicReceipt receipt={{ ...receipt, data: { ...receipt.data, completedAt: receipt.data?.completedAt ?? '' } }} />
        </div>
      );
    }

    if (pending.type === 'airtime') {
      const category = pending.data?.planName ? 'data' : 'airtime';
      const colors = category === 'data' 
        ? { primary: '#a855f7', secondary: '#c084fc', accent: '#f3e8ff', icon: 'wifi' }
        : { primary: '#ec4899', secondary: '#f472b6', accent: '#fce7f3', icon: 'phone' };
      
      const receipt = {
        template: {
          id: `${category}-default`,
          category,
          template_name: category === 'data' ? 'Data Purchase Receipt' : 'Airtime Recharge Receipt',
          fields: ['phoneNumber', 'network'],
          color_scheme: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
          icon: colors.icon,
        },
        data: {
          biller: { id: pending.data?.network, name: pending.data?.network },
          amount: pending.data?.amount,
          accountId: pending.data?.phoneNumber,
          planName: pending.data?.planName,
          transactionId: pending.transactionId || pending.data?.transactionId,
          completedAt: pending.completedAt ?? '',
        },
      };
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <DynamicReceipt receipt={receipt} />
        </div>
      );
    }

    if (pending.type === 'bill-payment') {
      const getTemplateColors = (cat: string) => {
        const colors: Record<string, any> = {
          utility: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fef3c7', icon: 'zap' },
          'cable tv': { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#ede9fe', icon: 'tv' },
          'internet subscription': { primary: '#06b6d4', secondary: '#22d3ee', accent: '#cffafe', icon: 'wifi' },
          betting: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5', icon: 'trophy' },
          water: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#dbeafe', icon: 'droplet' },
          airtime: { primary: '#ec4899', secondary: '#f472b6', accent: '#fce7f3', icon: 'phone' },
          data: { primary: '#a855f7', secondary: '#c084fc', accent: '#f3e8ff', icon: 'wifi' },
        };
        return colors[cat.toLowerCase()] || { primary: '#6366f1', secondary: '#818cf8', accent: '#e0e7ff', icon: 'receipt' };
      };
      
      const category = pending.data?.category || 'generic';
      const colors = getTemplateColors(category);
      const receipt = {
        template: {
          id: `${category}-default`,
          category,
          template_name: 'Bill Payment Receipt',
          fields: ['accountId'],
          color_scheme: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
          icon: colors.icon,
        },
        data: pending.data,
      };
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <DynamicReceipt receipt={{ ...receipt, data: { ...receipt.data, completedAt: receipt.data?.completedAt ?? pending.completedAt ?? '' } }} />
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
    // Determine where the user should be returned to when they click "Transfer Again"
    let returnPath = '/';
    if (pending.type === 'external-transfer') {
      returnPath = '/external-transfer';
    } else if (pending.type === 'internal-transfer') {
      returnPath = '/internal-transfer';
    } else if (pending.data?.isInternalTransfer === true) {
      returnPath = '/internal-transfer';
    } else if (pending.data?.isInternalTransfer === false) {
      returnPath = '/external-transfer';
    }

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
          returnPath={returnPath}
        />
      </div>
    );
  }

  // While redirecting, render nothing (or a minimal loader). The redirect
  // will take the user back to the dashboard when there's no pending receipt.
  return null;
}
