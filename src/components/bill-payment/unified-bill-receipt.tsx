"use client";

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, ArrowLeftRight } from 'lucide-react';
import React, { useRef, useState } from 'react';
import ShareModal from '@/components/transaction/share-modal';
import { useRouter } from 'next/navigation';
import { OvoLogo } from '@/components/layout/logo';

export interface BillPaymentReceiptData {
  type: 'bill-payment';
  billerName: string;
  accountId: string;
  amount: number;
  category?: string;
  verifiedName?: string;
  token?: string;
  KCT1?: string;
  KCT2?: string;
  transactionId?: string;
  completedAt?: string;
}

export function UnifiedBillReceipt({ data }: { data: BillPaymentReceiptData }) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Determine title based on category
  const getTitle = () => {
    const category = data.category?.toLowerCase() || '';
    if (category.includes('utility')) return 'Utility Bill Payment';
    if (category.includes('cable')) return 'Cable TV Payment';
    if (category.includes('internet')) return 'Internet Subscription';
    if (category.includes('water')) return 'Water Bill Payment';
    return 'Bill Payment';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div ref={receiptRef} className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-[#13284d] text-white p-6 text-center relative">
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
                <ArrowLeftRight className="w-3 h-3" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">Transfer Successful</h2>
            <p className="text-blue-100 text-sm">{getTitle()}</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2 text-green-300">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-sm">Successful</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Transfer Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient</span>
                  <span className="font-semibold text-right">{data.billerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account</span>
                  <span className="font-semibold text-right">{data.accountId}</span>
                </div>
                {data.verifiedName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Name</span>
                    <span className="font-semibold text-right">{data.verifiedName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold text-right">Ovomonie Wallet</span>
                </div>
                {data.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference</span>
                    <span className="font-mono text-xs font-semibold">{data.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-semibold text-right text-xs">
                    {data.completedAt ? new Date(data.completedAt).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Token display for electricity bills */}
            {(data.token || data.KCT1 || data.KCT2) && (
              <div className="bg-blue-50 border-t border-blue-200 p-4">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Payment Token</h4>
                {data.token && (
                  <div className="bg-white p-3 rounded border border-blue-200 mb-2">
                    <p className="text-xs text-blue-700 mb-1">Token</p>
                    <p className="font-mono font-bold text-blue-900 text-lg">{data.token}</p>
                  </div>
                )}
                {data.KCT1 && (
                  <div className="bg-white p-3 rounded border border-blue-200 mb-2">
                    <p className="text-xs text-blue-700 mb-1">KCT1</p>
                    <p className="font-mono font-bold text-blue-900 text-lg">{data.KCT1}</p>
                  </div>
                )}
                {data.KCT2 && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">KCT2</p>
                    <p className="font-mono font-bold text-blue-900 text-lg">{data.KCT2}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-4 pt-2">
            <div className="w-full">
              <p className="text-xs text-gray-500 text-center mb-4">Powered by Ovomonie</p>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-[#13284d] hover:bg-[#13284d]/90 text-white" 
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Receipt
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push('/bill-payment')}
                  >
                    Pay Again
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title="Bill Payment Receipt" />
    </div>
  );
}





