"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, ArrowLeftRight } from 'lucide-react';
import ShareModal from './share-modal';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type GeneralReceiptProps = {
  title?: string;
  amount: number;
  status?: string;
  recipient?: string;
  accountInfo?: string;
  transactionId?: string;
  paymentMethod?: string;
  date?: string;
  onReport?: () => void;
  /** route to return to when user clicks Transfer Again (defaults to '/') */
  returnPath?: string;
};

export default function GeneralReceipt({ 
  title = 'Transfer', 
  amount, 
  status = 'Successful', 
  recipient, 
  accountInfo, 
  transactionId, 
  paymentMethod, 
  date, 
  onReport, 
  returnPath 
}: GeneralReceiptProps) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div ref={receiptRef}>
        <Card className="w-full max-w-md bg-white shadow-2xl border-0 relative overflow-hidden">
        {/* Success Header */}
        <CardHeader className="relative z-10 bg-gradient-to-r from-[#001f3f] to-[#003d7a] text-white pb-8">
          <div className="flex flex-col items-center py-6">
            <div className="rounded-full bg-[#001f3f] p-4 mb-4 w-24 h-24 flex items-center justify-center shadow-lg">
              <Image 
                src="https://i.postimg.cc/VshPGNTT/ovomonie-logo-D0smmw0D.png" 
                alt="Ovomonie" 
                width={64} 
                height={64}
                className="object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Transaction Successful</CardTitle>
            <CardDescription className="text-white/90 mt-1">{title}</CardDescription>
            <div className="mt-6 text-5xl font-bold text-white">₦{amount.toLocaleString()}</div>
            <div className="mt-3 px-4 py-1.5 bg-white/20 rounded-full text-sm text-white flex items-center gap-2 backdrop-blur-sm">
              <Check className="w-4 h-4" /> {status}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4 relative z-10">
            <div className="bg-gray-50 p-5 rounded-xl space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Transaction Details</h4>
              <div className="space-y-3">
                {recipient && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Recipient</span>
                    <span className="font-semibold text-gray-900">{recipient}</span>
                  </div>
                )}
                {accountInfo && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Account</span>
                    <span className="font-semibold text-gray-900 text-right text-sm">{accountInfo}</span>
                  </div>
                )}
                {transactionId && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Reference</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-900">{transactionId}</span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Method</span>
                    <span className="font-semibold text-gray-900">{paymentMethod}</span>
                  </div>
                )}
                {date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date & Time</span>
                    <span className="font-semibold text-gray-900 text-sm">{date}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <div data-powered-by="ovomonie" className="text-center text-xs text-gray-500 py-4 border-t border-gray-100">Powered by Ovomonie</div>
        <CardFooter className="flex flex-col gap-3 p-6 pt-0 relative z-10 no-capture">
          <Button className="w-full bg-[#001f3f] hover:bg-[#001f3f]/90 text-white font-semibold py-6 shadow-lg" onClick={() => setIsShareOpen(true)}>
            <Share2 className="mr-2 w-5 h-5"/> Share Receipt
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-2" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button variant="outline" className="border-2" onClick={() => router.push(returnPath || '/internal-transfer')}>Transfer Again</Button>
          </div>
        </CardFooter>
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={title} />
    </div>
  );
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={title} />
    </div>
  );
}
