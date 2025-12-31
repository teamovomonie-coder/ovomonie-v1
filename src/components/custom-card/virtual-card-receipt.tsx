"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import ShareModal from '@/components/transaction/share-modal';
import { OvoLogo } from '@/components/layout/logo';

export default function VirtualCardReceipt({ data, transactionId, onReset }: { data: any; transactionId?: string; onReset?: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  return (
    <>
      <div ref={receiptRef} className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-[#13284d] text-white p-6 text-center relative">
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
                <CreditCard className="w-3 h-3" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">Card Created Successfully</h2>
            <p className="text-blue-100 text-sm">Virtual Card</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-center text-green-300">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-sm">Completed</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Card Details</h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-600 mb-1">Card Number</div>
                  <div className="font-mono text-lg font-semibold">{data?.cardNumber}</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 h-6 px-2 text-xs"
                    onClick={() => handleCopy(data?.cardNumber || '', 'Card Number')}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-600 mb-1">Expiry Date</div>
                    <div className="font-mono font-semibold">{data?.expiryDate}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-600 mb-1">CVV</div>
                    <div className="font-mono font-semibold">{data?.cvv}</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card ID</span>
                    <span className="font-mono text-xs font-semibold">{data?.cardId}</span>
                  </div>
                  {transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction</span>
                      <span className="font-mono text-xs font-semibold">{transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-semibold text-right text-xs">{new Date().toLocaleString()}</span>
                  </div>
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
                    onClick={onReset || (() => router.push('/cards'))}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title="Virtual Card Receipt" 
      />
    </>
  );
}
