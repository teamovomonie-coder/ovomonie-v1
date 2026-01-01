"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
import { AirtimeReceipt } from '@/components/airtime/airtime-receipt';
=======
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Share2, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';
import { BettingReceipt } from '@/components/betting/betting-receipt';
import { AirtimeReceipt } from '@/components/airtime/airtime-receipt';
import { UnifiedBillReceipt } from '@/components/bill-payment/unified-bill-receipt';
import GeneralReceipt from '@/components/transaction/general-receipt';
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c

interface ReceiptData {
  type: 'AIRTIME' | 'DATA';
  reference: string;
  amount: number;
<<<<<<< HEAD
  phoneNumber: string;
  network: string;
  planName?: string;
  transactionId: string;
  completedAt: string;
  isDataPlan?: boolean;
=======
  narration: string;
  party_name: string;
  party_account?: string;
  balance_after: number;
  status: string;
  category: string;
  metadata: {
    service_type?: string;
    recipient?: string;
    network?: string;
    plan_name?: string;
    planName?: string;
    vfd_reference?: string;
    bettingProvider?: string;
    platform?: string;
    accountId?: string;
    phoneNumber?: string;
    category?: string;
    receipt?: {
      billerName?: string;
      biller?: { name?: string };
      accountId?: string;
      customerId?: string;
      verifiedName?: string;
      customerName?: string;
      token?: string;
      KCT1?: string;
      KCT2?: string;
      category?: string;
    };
    billerName?: string;
    biller?: { name?: string };
    accountId?: string;
    customerId?: string;
    verifiedName?: string;
    customerName?: string;
    token?: string;
    KCT1?: string;
    KCT2?: string;
    bankName?: string;
    accountNumber?: string;
    [key: string]: any;
  };
  created_at: string;
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async (retryCount = 0) => {
      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const transactionId = params.transactionId as string;
        const txId = searchParams.get('txId') || transactionId;
        const ref = searchParams.get('ref') || transactionId;
        const cacheBuster = Date.now() + Math.random(); // Enhanced cache busting
        
        // Use the reference parameter for better lookup
        const url = `/api/transactions/receipt/${encodeURIComponent(ref)}?txId=${encodeURIComponent(txId)}&_=${cacheBuster}`;
        
        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
=======
  const [isShareOpen, setIsShareOpen] = useState(false);

  const transactionId = params.transactionId as string;
  const timestamp = searchParams.get('t');
  const reference = searchParams.get('ref'); // Reference from processing page

  useEffect(() => {
    if (!transactionId) return;

    // Clear any previous receipt state immediately and aggressively
    try {
      localStorage.removeItem('ovo-pending-receipt');
      // Clear any cached transaction data
      sessionStorage.removeItem(`tx-${transactionId}`);
    } catch (e) {
      console.debug('[ReceiptPage] Failed to clear storage:', e);
    }

    // Reset state immediately
    setTransaction(null);
    setLoading(true);

    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Use cache buster to prevent stale data - always use current timestamp
        const cacheBuster = Date.now();
        
        // Fetch transaction by specific ID (not "latest") with strict validation
        const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}?_=${cacheBuster}&ref=${encodeURIComponent(reference || '')}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
          },
          cache: 'no-store'
        });

        if (!response.ok) {
<<<<<<< HEAD
          // Retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchReceipt(retryCount + 1);
          }
          throw new Error(`Receipt not found (${response.status})`);
        }

        const data = await response.json();
        if (data.ok && data.receipt) {
          setReceipt(data.receipt);
        } else {
          throw new Error('Invalid receipt data');
        }
      } catch (err) {
        console.error('Receipt fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load receipt');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => router.replace('/dashboard'), 3000);
=======
          if (response.status === 404) {
            // Transaction not found - might still be processing
            // Redirect back to processing page if we have reference
            if (reference) {
              router.push(`/processing/${reference}`);
              return;
            }
          }
          throw new Error('Transaction not found');
        }

        const data = await response.json();
        const tx = data.transaction || data;

        // CRITICAL: Verify the transaction ID/reference matches exactly
        // This prevents showing wrong/stale receipts
        const idMatches = tx.id === transactionId;
        const referenceMatches = tx.reference === transactionId;
        
        if (!idMatches && !referenceMatches) {
          console.error('[ReceiptPage] Transaction ID mismatch!', {
            requested: transactionId,
            received: { id: tx.id, reference: tx.reference }
          });
          // Don't show wrong transaction - redirect to processing or dashboard
          if (reference) {
            router.push(`/processing/${reference}`);
          } else {
            router.push('/dashboard');
          }
          return;
        }

        // Verify reference matches if provided (additional validation)
        if (reference && tx.reference && tx.reference !== reference) {
          console.error('[ReceiptPage] Reference mismatch!', {
            expected: reference,
            got: tx.reference,
            transactionId
          });
          // Don't show wrong transaction - redirect back to processing
          router.push(`/processing/${reference}`);
          return;
        }

        // CRITICAL: Verify transaction status is completed/success before showing
        // Never show receipt for pending/processing transactions
        const isCompleted = tx.status === 'completed' || tx.status === 'success';
        if (tx.status && !isCompleted) {
          console.warn('[ReceiptPage] Transaction not yet completed, status:', tx.status);
          // Transaction not yet completed - redirect back to processing
          if (reference) {
            router.push(`/processing/${reference}`);
            return;
          }
          // If no reference, redirect to dashboard
          router.push('/dashboard');
          return;
        }

        // Additional safety check: ensure transaction was created recently (within last hour)
        // This prevents showing very old transactions by mistake
        if (tx.created_at) {
          const txDate = new Date(tx.created_at);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (txDate < oneHourAgo) {
            console.warn('[ReceiptPage] Transaction is too old, may be stale:', {
              transactionId,
              created_at: tx.created_at
            });
            // Still show it but log warning - user might be viewing old receipt via direct link
          }
        }

        // Set transaction only after all validations pass
        setTransaction(tx);
      } catch (error) {
        console.error('[ReceiptPage] Failed to load receipt:', error);
        // If we have a reference, try redirecting to processing page
        if (reference) {
          router.push(`/processing/${reference}`);
        } else {
          router.push('/dashboard');
        }
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
      } finally {
        setLoading(false);
      }
    };

<<<<<<< HEAD
    if (params.transactionId) {
      // Clear any existing receipt data before fetching new one
      setReceipt(null);
      setError(null);
      setLoading(true);
      fetchReceipt();
    }
  }, [params.transactionId, searchParams, router]);
=======
    // Small delay to ensure state is cleared
    const timeoutId = setTimeout(() => {
      fetchTransaction();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [transactionId, timestamp, reference, router]);
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Loading Receipt</h2>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-destructive">Receipt Not Found</h2>
          <p className="text-sm text-muted-foreground">{error || 'Transaction not found'}</p>
          <p className="text-xs text-muted-foreground">Redirecting to dashboard in 3 seconds...</p>
          <Button onClick={() => router.replace('/dashboard')} variant="outline">
            Go to Dashboard Now
          </Button>
        </div>
=======
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Receipt not found</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amountInNaira = transaction.amount / 100;
  const category = transaction.category?.toLowerCase() || '';
  const metadata = transaction.metadata || {};

  // Determine receipt type based on category and metadata
  const isBetting = category === 'betting' || metadata.service_type === 'betting';
  const isAirtime = category === 'airtime' || category === 'data' || metadata.service_type === 'airtime';
  const isBillPayment = category === 'bill_payment' || category === 'bill-payment' || category.includes('bill');

  // Create unique key to force re-render when transaction changes
  const receiptKey = `${transaction.id}-${transaction.reference}-${transaction.created_at}`;

  // Render appropriate receipt based on transaction type
  if (isBetting) {
    return (
      <div key={receiptKey}>
        <BettingReceipt 
          data={{
            type: 'betting',
            platform: metadata.bettingProvider || metadata.platform || 'betting',
            accountId: metadata.accountId || transaction.party_account || 'N/A',
            amount: amountInNaira,
            recipientName: transaction.party_name,
            transactionId: transaction.reference,
            completedAt: transaction.created_at,
          }}
        />
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AirtimeReceipt 
        key={`${receipt.transactionId}-${receipt.completedAt}`} // Force re-render for each unique transaction
        data={{
          type: 'airtime',
          network: receipt.network,
          phoneNumber: receipt.phoneNumber,
          amount: receipt.amount,
          planName: receipt.planName,
          isDataPlan: receipt.type === 'DATA' || receipt.isDataPlan,
          transactionId: receipt.transactionId,
          completedAt: receipt.completedAt
        }} />
=======
  if (isAirtime) {
    return (
      <div key={receiptKey}>
        <AirtimeReceipt 
          data={{
            type: 'airtime',
            network: metadata.network || transaction.metadata?.network || 'Mobile Network',
            phoneNumber: metadata.recipient || transaction.party_account || metadata.phoneNumber || '',
            amount: amountInNaira,
            planName: metadata.plan_name || metadata.planName,
            isDataPlan: !!metadata.plan_name || !!metadata.planName,
            transactionId: transaction.reference,
            completedAt: transaction.created_at,
          }}
        />
      </div>
    );
  }

  if (isBillPayment) {
    // Extract bill payment data from metadata
    const billMetadata = metadata.receipt || metadata;
    return (
      <div key={receiptKey}>
        <UnifiedBillReceipt 
          data={{
            type: 'bill-payment',
            billerName: transaction.party_name || billMetadata.billerName || billMetadata.biller?.name || 'Service Provider',
            accountId: transaction.party_account || billMetadata.accountId || billMetadata.customerId || '',
            amount: amountInNaira,
            category: billMetadata.category || metadata.category || transaction.category,
            verifiedName: billMetadata.verifiedName || billMetadata.customerName,
            token: billMetadata.token || metadata.token,
            KCT1: billMetadata.KCT1 || metadata.KCT1,
            KCT2: billMetadata.KCT2 || metadata.KCT2,
            transactionId: transaction.reference,
            completedAt: transaction.created_at,
          }}
        />
      </div>
    );
  }

  // Default to GeneralReceipt for transfers and other transactions
  return (
    <div key={receiptKey}>
      <GeneralReceipt
        title={transaction.category === 'transfer' ? 'Transfer' : transaction.category}
        amount={amountInNaira}
        status="Successful"
        recipient={transaction.party_name}
        accountInfo={transaction.party_account || transaction.metadata?.accountNumber}
        transactionId={transaction.reference}
        paymentMethod={transaction.metadata?.bankName || 'Ovomonie Wallet'}
        date={transaction.created_at ? new Date(transaction.created_at).toLocaleString() : new Date().toLocaleString()}
        returnPath={transaction.category === 'transfer' ? '/internal-transfer' : '/'}
      />
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
    </div>
  );
}