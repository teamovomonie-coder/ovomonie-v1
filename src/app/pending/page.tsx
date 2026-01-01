"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Home } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { OvoLogo } from '@/components/layout/logo';

export default function PendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const amount = searchParams?.get('amount') || '0';
    const type = searchParams?.get('type') || 'transaction';
    const network = searchParams?.get('network') || '';
    const phone = searchParams?.get('phone') || '';
    const ref = searchParams?.get('ref') || `pending_${Date.now()}`;

    setTransactionData({
      amount: parseFloat(amount),
      type,
      network,
      phone,
      reference: ref,
      pendingAt: new Date().toISOString()
    });
  }, [searchParams]);

  if (!transactionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-orange-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-sm shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-yellow-600 text-white p-6 text-center">
            <div className="absolute top-4 right-4">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-1">Transaction Pending</h2>
            <p className="text-yellow-100 text-sm">{transactionData.type} Transaction</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">₦{transactionData.amount.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2 text-yellow-200">
                <Clock className="w-4 h-4 mr-1 animate-pulse" />
                <span className="text-sm">Processing</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                {transactionData.network && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold">{transactionData.network}</span>
                  </div>
                )}
                {transactionData.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Number</span>
                    <span className="font-semibold">{transactionData.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-mono text-xs">{transactionData.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Initiated At</span>
                  <span className="text-xs">{new Date(transactionData.pendingAt).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Status Message */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">Status:</p>
                <p className="text-sm text-yellow-700 mt-1">Your transaction is being processed. Please wait...</p>
              </div>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-4">
            <div className="w-full space-y-2">
              <Button 
                className="w-full bg-yellow-600 hover:bg-yellow-700" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/dashboard')}
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}