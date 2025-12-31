"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
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
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptStore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null);
  const [expectedReceiptId, setExpectedReceiptId] = useState<string | null>(null);

  const loadNewReceipt = useCallback(async () => {
    // Check localStorage immediately (no loading state)
    try {
      const raw = localStorage.getItem('ovo-pending-receipt');
      if (raw) {
        const parsed = JSON.parse(raw) as ReceiptStore;
        if (parsed && typeof parsed === 'object' && ('type' in parsed) && ('data' in parsed)) {
          setCurrentReceipt(parsed);
          setIsReady(true);
          setIsProcessing(false);
          return;
        }
      }
    } catch (e) {
      console.debug('[SuccessPage] localStorage parse error:', e);
    }
    
    // If no localStorage receipt, redirect immediately
    router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    loadNewReceipt();
  }, [loadNewReceipt]);

  useEffect(() => {
    const handler = () => {
      // Set expected receipt ID from the latest transaction
      const getExpectedId = async () => {
        try {
          const latest = await pendingTransactionService.getLatest();
          if (latest) {
            const expectedId = latest.transactionId || latest.reference || `${latest.type}-${Date.now()}`;
            setExpectedReceiptId(expectedId);
          }
        } catch (e) {
          // Fallback to localStorage
          const raw = localStorage.getItem('ovo-pending-receipt');
          if (raw) {
            const parsed = JSON.parse(raw);
            const expectedId = parsed.transactionId || parsed.reference || `${parsed.type}-${Date.now()}`;
            setExpectedReceiptId(expectedId);
          }
        }
      };
      
      setIsProcessing(true);
      setCurrentReceipt(null);
      setIsReady(false);
      getExpectedId().then(() => {
        // Only reload once, don't create infinite loop
        loadNewReceipt();
      });
    };

    window.addEventListener('ovo-pending-receipt-updated', handler);
    return () => {
      window.removeEventListener('ovo-pending-receipt-updated', handler);
    };
  }, [loadNewReceipt]);

  const handleReset = useCallback(async () => {
    if (currentReceipt?.reference) {
      await pendingTransactionService.deletePending(currentReceipt.reference);
    }
    try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {}
    router.push('/dashboard');
  }, [currentReceipt?.reference, router]);

  if (isProcessing || !isReady || !currentReceipt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Transaction</h2>
            <p className="text-sm text-muted-foreground">Generating your receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  const receiptKey = `receipt-${currentReceipt.type}-${currentReceipt.transactionId || currentReceipt.reference || Date.now()}`;

  if (currentReceipt.type === 'memo-transfer' && currentReceipt.recipientName) {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <MemoReceipt 
          data={currentReceipt.data} 
          recipientName={currentReceipt.recipientName} 
          onReset={handleReset} 
          transactionId={currentReceipt.transactionId} 
          date={currentReceipt.completedAt || currentReceipt.data?.date} 
          isInternalTransfer={currentReceipt.data?.isInternalTransfer} 
        />
      </div>
    );
  }

  if (currentReceipt.type === 'external-transfer' && currentReceipt.recipientName) {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <GeneralReceipt
          title="External Transfer"
          amount={currentReceipt.data?.amount || 0}
          recipient={currentReceipt.recipientName}
          accountInfo={`${currentReceipt.data?.accountNumber} • ${currentReceipt.bankName}`}
          transactionId={currentReceipt.transactionId || currentReceipt.reference || `OVO-${Date.now()}`}
          paymentMethod={currentReceipt.bankName || 'Bank Transfer'}
          date={currentReceipt.completedAt || new Date().toLocaleString()}
          onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
          returnPath="/external-transfer"
        />
      </div>
    );
  }

  if (currentReceipt.type === 'internal-transfer' && currentReceipt.recipientName) {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <GeneralReceipt
          title="Internal Transfer"
          amount={currentReceipt.data?.amount || 0}
          recipient={currentReceipt.recipientName}
          accountInfo={`${currentReceipt.data?.accountNumber} • Ovomonie`}
          transactionId={currentReceipt.transactionId || currentReceipt.reference || `OVO-${Date.now()}`}
          paymentMethod="Ovomonie"
          date={currentReceipt.completedAt || new Date().toLocaleString()}
          onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
          returnPath="/internal-transfer"
        />
      </div>
    );
  }

  if (currentReceipt.type === 'betting') {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <BettingReceipt data={{
          type: 'betting',
          platform: currentReceipt.data?.platform || 'betting',
          accountId: currentReceipt.data?.accountId || '',
          amount: currentReceipt.data?.amount || 0,
          recipientName: currentReceipt.data?.recipientName,
          transactionId: currentReceipt.transactionId || currentReceipt.reference,
          completedAt: currentReceipt.completedAt || new Date().toISOString()
        }} />
      </div>
    );
  }

  if (currentReceipt.type === 'airtime') {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <AirtimeReceipt data={{
          type: 'airtime',
          network: currentReceipt.data?.network || '',
          phoneNumber: currentReceipt.data?.phoneNumber || '',
          amount: currentReceipt.data?.amount || 0,
          planName: currentReceipt.data?.planName,
          isDataPlan: !!currentReceipt.data?.planName,
          transactionId: currentReceipt.transactionId || currentReceipt.reference,
          completedAt: currentReceipt.completedAt || new Date().toISOString()
        }} />
      </div>
    );
  }

  if (currentReceipt.type === 'bill-payment') {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <DynamicReceipt receipt={{
          template: {
            id: 'bill-payment-default',
            category: currentReceipt.data?.category || 'utility',
            template_name: 'Bill Payment Receipt',
            fields: ['accountId'],
            color_scheme: { primary: '#13284d', secondary: '#13284d', accent: '#f3f4f6' },
            icon: 'receipt',
          },
          data: {
            ...currentReceipt.data,
            biller: { name: currentReceipt.data?.biller || 'Service Provider' },
            completedAt: currentReceipt.completedAt || new Date().toISOString()
          }
        }} />
      </div>
    );
  }

  if (currentReceipt.type === 'virtual-card') {
    return (
      <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
        <VirtualCardReceipt
          data={currentReceipt.data}
          transactionId={currentReceipt.transactionId}
          onReset={handleReset}
        />
      </div>
    );
  }

  let returnPath = '/';
  if (currentReceipt.type === 'external-transfer') {
    returnPath = '/external-transfer';
  } else if (currentReceipt.type === 'internal-transfer') {
    returnPath = '/internal-transfer';
  } else if (currentReceipt.data?.isInternalTransfer === true) {
    returnPath = '/internal-transfer';
  } else if (currentReceipt.data?.isInternalTransfer === false) {
    returnPath = '/external-transfer';
  }

  return (
    <div key={receiptKey} className="min-h-screen flex items-center justify-center p-4">
      <GeneralReceipt
        title={(currentReceipt.type === 'external-transfer' ? 'External Transfer' : currentReceipt.data && currentReceipt.data.typeName) || 'Transaction'}
        amount={currentReceipt.data?.amount || 0}
        recipient={currentReceipt.recipientName || currentReceipt.data?.recipient}
        accountInfo={currentReceipt.data?.accountNumber || ''}
        transactionId={currentReceipt.transactionId || currentReceipt.data?.transactionId || `OVO-${Date.now()}`}
        paymentMethod={currentReceipt.bankName || currentReceipt.data?.paymentMethod || currentReceipt.data?.method}
        date={currentReceipt.completedAt || currentReceipt.data?.date || new Date().toLocaleString()}
        onReport={() => { try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {} ; router.push('/support'); }}
        returnPath={returnPath}
      />
    </div>
  );
}