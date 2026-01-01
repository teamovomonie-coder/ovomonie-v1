"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { OvoLogo } from '@/components/layout/logo';

export default function FailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const amount = searchParams?.get('amount') || '0';
    const type = searchParams?.get('type') || 'transaction';
    const network = searchParams?.get('network') || '';
    const phone = searchParams?.get('phone') || '';
    const reason = searchParams?.get('reason') || 'Transaction failed';
    const ref = searchParams?.get('ref') || `failed_${Date.now()}`;

    setTransactionData({
      amount: parseFloat(amount),
      type,
      network,
      phone,
      reason,
      reference: ref,
      failedAt: new Date().toISOString()
    });
  }, [searchParams]);

  if (!transactionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-pink-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-sm shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-red-600 text-white p-6 text-center">
            <div className="absolute top-4 right-4">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-1">Transaction Failed</h2>
            <p className="text-red-100 text-sm">{transactionData.type} Transaction</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">₦{transactionData.amount.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2 text-red-200">
                <XCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Failed</span>
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
                  <span className="text-gray-600">Failed At</span>
                  <span className="text-xs">{new Date(transactionData.failedAt).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Error Message */}
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">Reason for Failure:</p>
                <p className="text-sm text-red-700 mt-1">{transactionData.reason}</p>
              </div>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-4">
            <div className="w-full space-y-2">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                onClick={() => router.back()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
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