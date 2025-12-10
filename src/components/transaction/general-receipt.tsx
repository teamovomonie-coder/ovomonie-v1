"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Share2 } from 'lucide-react';
import ShareModal from './share-modal';
import { useRouter } from 'next/navigation';
import Watermark from './watermark';

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
};

export default function GeneralReceipt({ title = 'Transfer', amount, status = 'Successful', recipient, accountInfo, transactionId, paymentMethod, date, onReport }: GeneralReceiptProps) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div ref={receiptRef}>
        <Card className="w-full max-w-md bg-card relative overflow-visible min-h-[380px]">
        {/* Watermark: prefer a provided logo file in public/images, fallback to inline SVG */}
        <Watermark variant="center" opacity={0.06} maxSize="w-96 h-96" />
        <CardHeader className="relative z-10">
          <div className="flex flex-col items-center py-4">
            <div className="rounded-full bg-muted p-3 mb-2"><Check className="w-6 h-6 text-green-600" /></div>
            <CardTitle className="text-lg">{title} to {recipient}</CardTitle>
            <CardDescription className="text-2xl font-bold mt-2">₦{amount.toLocaleString()}</CardDescription>
            <div className="mt-2 text-sm text-green-600 flex items-center gap-2"><Check className="w-4 h-4" /> {status}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 relative z-10">
            <div className="bg-secondary/5 p-4 rounded-md">
              <h4 className="font-semibold mb-2">Transaction Details</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                {recipient && <div className="flex justify-between"><span>Recipient</span><span className="font-semibold">{recipient}</span></div>}
                {accountInfo && <div className="flex justify-between"><span>Recipient Details</span><span className="font-semibold text-right">{accountInfo}</span></div>}
                {transactionId && <div className="flex justify-between items-center"><span>Transaction No.</span><span className="font-mono text-sm">{transactionId} <Copy className="inline-block ml-2 w-4 h-4" /></span></div>}
                {paymentMethod && <div className="flex justify-between"><span>Payment Method</span><span className="font-semibold">{paymentMethod}</span></div>}
                {date && <div className="flex justify-between"><span>Transaction Date</span><span className="font-semibold">{date}</span></div>}
              </div>
            </div>
          </div>
        </CardContent>
        <div data-powered-by="ovomonie" className="text-center text-xs text-muted-foreground py-4 border-t">Powered by Ovomonie</div>
        <CardFooter className="flex flex-col gap-3 p-4 relative z-10 no-capture">
            <div className="flex gap-2">
            <Button variant="ghost" className="w-full" onClick={() => { if (onReport) onReport(); else router.push('/support'); }}>Report Issue</Button>
            <Button className="w-full" onClick={() => setIsShareOpen(true)}><Share2 className="mr-2 w-4 h-4"/> Share Receipt</Button>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/payments')}>View Records</Button>
            <Button onClick={() => router.push('/')}>Transfer Again</Button>
          </div>
        </CardFooter>
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={title} />
    </div>
  );
}
