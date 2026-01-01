"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, Download, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfessionalReceiptProps {
  transactionData: {
    amount: number;
    network: string;
    phoneNumber: string;
    reference: string;
    date: string;
    type: string;
    status: 'success' | 'failed' | 'pending';
  };
}

export function ProfessionalReceipt({ transactionData }: ProfessionalReceiptProps) {
  const router = useRouter();
  
  const statusColors = {
    success: 'bg-green-600',
    failed: 'bg-red-600', 
    pending: 'bg-yellow-600'
  };

  const statusIcons = {
    success: <Check className="w-5 h-5" />,
    failed: <span className="text-xl">✗</span>,
    pending: <span className="text-xl animate-spin">⟳</span>
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className={`${statusColors[transactionData.status]} text-white p-6 text-center`}>
          <div className="mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              {statusIcons[transactionData.status]}
            </div>
            <h1 className="text-xl font-bold">
              {transactionData.status === 'success' ? 'Purchase Successful' : 
               transactionData.status === 'failed' ? 'Purchase Failed' : 
               'Purchase Pending'}
            </h1>
            <p className="text-sm opacity-90 mt-1">{transactionData.type} Purchase</p>
          </div>
          
          <div className="text-center">
            <p className="text-4xl font-bold mb-2">₦{transactionData.amount.toLocaleString()}</p>
            <div className="flex items-center justify-center gap-2 text-sm">
              {statusIcons[transactionData.status]}
              <span className="capitalize">{transactionData.status}</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Transaction Details</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Network</span>
              <span className="font-semibold text-gray-900">{transactionData.network}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Phone Number</span>
              <span className="font-semibold text-gray-900">{transactionData.phoneNumber}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Reference</span>
              <span className="font-mono text-xs font-semibold text-gray-900">{transactionData.reference}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-semibold text-gray-900">{transactionData.date}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Share2 className="w-4 h-4 mr-2" />
            Share Receipt
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Buy Again
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-500">Powered by Ovomonie</p>
        </div>
      </Card>
    </div>
  );
}