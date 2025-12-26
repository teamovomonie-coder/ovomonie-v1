"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Share2, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';

interface Transaction {
  id: string;
  reference: string;
  type: string;
  amount: number;
  narration: string;
  party_name: string;
  balance_after: number;
  status: string;
  category: string;
  metadata: {
    service_type: string;
    recipient: string;
    network: string;
    plan_name?: string;
    vfd_reference?: string;
  };
  created_at: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const transactionId = params.transactionId as string;
  const timestamp = searchParams.get('t');

  useEffect(() => {
    if (!transactionId) return;

    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('ovo-auth-token');
        const cacheBuster = timestamp || Date.now();
        const response = await fetch(`/api/transactions/${transactionId}?_=${cacheBuster}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Transaction not found');

        const data = await response.json();
        setTransaction(data.transaction || data);
      } catch (error) {
        console.error('Failed to load receipt', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, timestamp, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-600">Your {transaction.category === 'transfer' ? 'transfer' : transaction.category} was completed</p>
        </div>

        <div ref={receiptRef}>
          <Card className="w-full shadow-lg border-2 border-green-200">
            <CardHeader className="bg-green-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-lg font-bold">{transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} Receipt</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">{transaction.metadata.network}</p>
                <p className="text-4xl font-bold text-green-600">₦{amountInNaira.toLocaleString()}</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Reference</span>
                  <span className="font-mono">{transaction.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid To</span>
                  <span>{transaction.party_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Balance After</span>
                  <span>₦{(transaction.balance_after / 100).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}