"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DynamicReceipt } from '@/components/bill-payment/dynamic-receipt';

interface Transaction {
  id: string;
  type: string;
  reference: string;
  amount: number;
  data: any;
  status: string;
  created_at: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      const transactionId = params.id as string;
      
      if (!transactionId) {
        router.replace('/dashboard');
        return;
      }

      try {
        const token = localStorage.getItem('ovo-auth-token');
        const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Transaction not found');
        }

        const result = await response.json();
        
        if (result.ok && result.data) {
          setTransaction(result.data);
        } else {
          throw new Error('Transaction not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [params.id, router]);

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

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Transaction Not Found</h2>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getReceiptData = () => {
    if (transaction.type === 'airtime') {
      const isData = transaction.data?.planName || transaction.data?.isDataPlan;
      const category = isData ? 'data' : 'airtime';
      const colors = category === 'data'
        ? { primary: '#a855f7', secondary: '#c084fc', accent: '#f3e8ff', icon: 'wifi' }
        : { primary: '#ec4899', secondary: '#f472b6', accent: '#fce7f3', icon: 'phone' };

      return {
        template: {
          id: `${category}-default`,
          category,
          template_name: category === 'data' ? 'Data Purchase Receipt' : 'Airtime Recharge Receipt',
          fields: ['phoneNumber', 'network'],
          color_scheme: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
          icon: colors.icon,
        },
        data: {
          biller: { id: transaction.data?.network, name: transaction.data?.network },
          amount: transaction.amount,
          accountId: transaction.data?.phoneNumber,
          planName: transaction.data?.planName,
          transactionId: transaction.reference,
          completedAt: transaction.created_at,
        },
      };
    }

    return {
      template: {
        id: 'generic-default',
        category: transaction.type,
        template_name: 'Transaction Receipt',
        fields: [],
        color_scheme: { primary: '#6366f1', secondary: '#818cf8', accent: '#e0e7ff' },
        icon: 'receipt',
      },
      data: {
        amount: transaction.amount,
        transactionId: transaction.reference,
        completedAt: transaction.created_at,
        ...transaction.data,
      },
    };
  };

  const receiptData = getReceiptData();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <DynamicReceipt receipt={receiptData} />
    </div>
  );
}
