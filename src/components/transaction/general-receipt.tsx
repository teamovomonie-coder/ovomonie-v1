"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, ArrowLeftRight } from 'lucide-react';
import ShareModal from './share-modal';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import Image from 'next/image';
=======
import { OvoLogo } from '@/components/layout/logo';
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c

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
<<<<<<< HEAD
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
=======
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
            <h2 className="text-xl font-bold mb-1">
              {title === 'Transfer' || title?.includes('Transfer') ? 'Transfer Successful' : 
               title?.includes('Payment') ? 'Payment Successful' : 
               title?.includes('Betting') ? 'Betting Payment Successful' :
               title?.includes('Airtime') || title?.includes('Data') ? 'Purchase Successful' :
               title?.includes('Utility') ? 'Utility Payment Successful' :
               'Transaction Successful'}
            </h2>
            <p className="text-blue-100 text-sm">{title}</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">₦{amount.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2 text-green-300">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-sm">{status}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                {title === 'Transfer' || title?.includes('Transfer') ? 'Transfer Details' : 
                 title?.includes('Payment') ? 'Payment Details' : 
                 title?.includes('Betting') ? 'Betting Payment Details' :
                 title?.includes('Airtime') || title?.includes('Data') ? 'Purchase Details' :
                 title?.includes('Utility') ? 'Utility Payment Details' :
                 'Transaction Details'}
              </h3>
              <div className="space-y-2 text-sm">
                {recipient && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {title?.includes('Betting') ? 'Platform' :
                       title?.includes('Airtime') || title?.includes('Data') ? 'Network' :
                       title?.includes('Utility') ? 'Service Provider' :
                       'Recipient'}
                    </span>
                    <span className="font-semibold text-right">{recipient}</span>
                  </div>
                )}
                {accountInfo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {title?.includes('Betting') ? 'Account ID' :
                       title?.includes('Airtime') || title?.includes('Data') ? 'Phone Number' :
                       title?.includes('Utility') ? 'Account/Meter Number' :
                       'Account'}
                    </span>
                    <span className="font-semibold text-right">{accountInfo}</span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold text-right">{paymentMethod}</span>
                  </div>
                )}
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference</span>
                    <span className="font-mono text-xs font-semibold">{transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-semibold text-right text-xs">{date || new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
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
                    onClick={() => router.push(returnPath || '/dashboard')}
                  >
                    {title?.includes('Transfer') ? 'Transfer Again' : 'Done'}
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
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
