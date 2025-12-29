"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AirtimeReceipt } from '@/components/airtime/airtime-receipt';

interface ReceiptData {
  type: 'AIRTIME' | 'DATA';
  reference: string;
  amount: number;
  phoneNumber: string;
  network: string;
  planName?: string;
  transactionId: string;
  completedAt: string;
  isDataPlan?: boolean;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
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
          },
          cache: 'no-store'
        });

        if (!response.ok) {
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
      } finally {
        setLoading(false);
      }
    };

    if (params.transactionId) {
      // Clear any existing receipt data before fetching new one
      setReceipt(null);
      setError(null);
      setLoading(true);
      fetchReceipt();
    }
  }, [params.transactionId, searchParams, router]);

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-destructive">Receipt Not Found</h2>
          <p className="text-sm text-muted-foreground">{error || 'Transaction not found'}</p>
          <p className="text-xs text-muted-foreground">Redirecting to dashboard in 3 seconds...</p>
          <Button onClick={() => router.replace('/dashboard')} variant="outline">
            Go to Dashboard Now
          </Button>
        </div>
      </div>
    );
  }

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
    </div>
  );
}