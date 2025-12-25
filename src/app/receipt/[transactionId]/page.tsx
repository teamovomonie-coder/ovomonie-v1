'use client';
<<<<<<< HEAD

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Share2, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';
import { useRef } from 'react';

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
    vfd_reference: string;
  };
  created_at: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
=======

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Share2, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';
import { useRef } from 'react';

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
    vfd_reference: string;
  };
  created_at: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
>>>>>>> origin/main
  const receiptRef = useRef<HTMLDivElement>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const transactionId = params.transactionId as string;
<<<<<<< HEAD
  const timestamp = searchParams.get('t'); // Get timestamp to force refresh
=======
>>>>>>> origin/main

  useEffect(() => {
    if (!transactionId) return;

    const fetchTransaction = async () => {
<<<<<<< HEAD
      setLoading(true); // Reset loading state
      try {
        const token = localStorage.getItem('ovo-auth-token');
        const response = await fetch(`/api/transactions/${transactionId}?_=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store' // Disable caching
=======
      try {
        const token = localStorage.getItem('ovo-auth-token');
        const response = await fetch(`/api/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
>>>>>>> origin/main
        });

        if (!response.ok) {
          throw new Error('Transaction not found');
        }

        const data = await response.json();
        setTransaction(data.transaction);
      } catch (error) {
        console.error('Failed to load receipt');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
<<<<<<< HEAD
  }, [transactionId, timestamp, router]); // Add timestamp to dependencies
=======
  }, [transactionId, router]);
>>>>>>> origin/main

  const handleTransferAgain = () => {
    if (!transaction) return;
    
    const category = transaction.category;
<<<<<<< HEAD
    router.push(`/bill-payment?category=${category}`);
=======
    if (category === 'transfer') {
      router.push('/external-transfer');
    } else {
      router.push(`/bill-payment?category=${category}`);
    }
>>>>>>> origin/main
  };

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

  const getNetworkLogo = (network: string) => {
    const networkLower = network?.toLowerCase() || '';
    if (networkLower.includes('mtn')) return '/mtn.jpg';
    if (networkLower.includes('airtel')) return '/airtel.png';
    if (networkLower.includes('glo')) return '/glo.png';
    if (networkLower.includes('9mobile') || networkLower.includes('t2')) return '/t2.png';
    return null;
  };

  const networkLogo = getNetworkLogo(transaction.metadata.network);
  const amountInNaira = transaction.amount / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Success Status */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
<<<<<<< HEAD
          <p className="text-gray-600">Your {transaction.category} purchase was completed</p>
=======
          <p className="text-gray-600">
            Your {transaction.category === 'transfer' ? 'transfer' : transaction.category} was completed
          </p>
>>>>>>> origin/main
        </div>

        {/* Receipt */}
        <div ref={receiptRef}>
          <Card className="w-full shadow-lg border-2 border-green-200">
            <CardHeader className="bg-green-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} Receipt
                {networkLogo && (
                  <div className="w-8 h-8 bg-white rounded p-1">
                    <img src={networkLogo} alt={transaction.metadata.network} className="w-full h-full object-contain" />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">{transaction.metadata.network}</p>
                <p className="text-4xl font-bold text-green-600">₦{amountInNaira.toLocaleString()}</p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-semibold">{transaction.metadata.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">{transaction.metadata.network}</span>
                </div>
                {transaction.metadata.plan_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold">{transaction.metadata.plan_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">₦{amountInNaira.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-semibold text-xs font-mono">{transaction.reference.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold text-xs">{new Date(transaction.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-green-600 capitalize">{transaction.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
<<<<<<< HEAD
          <Button 
=======
            <Button 
>>>>>>> origin/main
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleTransferAgain}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> 
<<<<<<< HEAD
            {transaction.category === 'airtime' ? 'Buy Airtime Again' : 
=======
            {transaction.category === 'transfer' ? 'Transfer Again' :
             transaction.category === 'airtime' ? 'Buy Airtime Again' : 
>>>>>>> origin/main
             transaction.category === 'data' ? 'Buy Data Again' : 
             'Pay Again'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="mr-2 h-4 w-4" /> 
            Share Receipt
          </Button>
        </div>

        <ShareModal 
          open={isShareOpen} 
          onOpenChange={setIsShareOpen} 
          targetRef={receiptRef} 
          title={`${transaction.category} Receipt`} 
        />
      </div>
    </div>
  );
}