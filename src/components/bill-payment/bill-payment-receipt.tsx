"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Watermark from '@/components/transaction/watermark';
import { Share2, Wallet } from 'lucide-react';
import React, { useRef, useState } from 'react';
import ShareModal from '@/components/transaction/share-modal';
import { useToast } from '@/hooks/use-toast';

export interface BillPaymentReceiptData {
  type: 'bill-payment';
  biller: {
    id: string;
    name: string;
  };
  amount: number;
  accountId: string;
  verifiedName?: string | null;
  bouquet?: { id: string; name: string; price: number } | null;
  transactionId?: string;
  completedAt?: string;
  token?: string | null;
  KCT1?: string | null;
  KCT2?: string | null;
}

export function BillPaymentReceipt({ data }: { data: BillPaymentReceiptData }) {
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <div ref={receiptRef}>
        <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20 overflow-visible min-h-[380px] relative">
      <Watermark variant="center" opacity={0.06} maxSize="w-96 h-96" />
      <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10">
        <CardTitle className="text-lg font-bold">Bill Payment Successful</CardTitle>
        <Wallet className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 bg-card text-card-foreground relative z-10">
        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payee</span>
            <span className="font-semibold">{data.biller.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          {data.verifiedName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{data.verifiedName}</span>
            </div>
          )}
          {data.bouquet && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span className="font-semibold">{data.bouquet.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          {data.transactionId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0,12)}...</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{data.completedAt ? new Date(data.completedAt).toLocaleString() : new Date().toLocaleString()}</span>
          </div>
        </div>
        {(data.token || data.KCT1 || data.KCT2) && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="text-xs font-semibold text-green-800 dark:text-green-200">Energy Token</p>
              {data.KCT1 && data.KCT2 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">KCT1:</span>
                    <code className="text-sm font-mono font-bold">{data.KCT1}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">KCT2:</span>
                    <code className="text-sm font-mono font-bold">{data.KCT2}</code>
                  </div>
                </div>
              )}
              {data.token && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Token:</span>
                  <code className="text-sm font-mono font-bold">{data.token}</code>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {data.KCT1 && data.KCT2 ? 'Enter KCT1, then KCT2, then your token on your meter' : 'Enter this token on your meter to load energy'}
              </p>
            </div>
          </>
        )}
      </CardContent>
        <CardFooter className="flex-col gap-2 p-4 pt-0 relative z-10">
        <p data-powered-by="ovomonie" className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
        <Button className="w-full" onClick={() => setIsShareOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" /> Share Receipt
        </Button>
      </CardFooter>
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={`${data.biller.name} Receipt`} />
    </>
  );
}
