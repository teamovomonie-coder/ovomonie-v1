"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Watermark from '@/components/transaction/watermark';
import { Share2, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useRef, useState } from 'react';
import ShareModal from '@/components/transaction/share-modal';

import networks from './network-logos';

export interface AirtimeReceiptData {
  type: 'airtime';
  network: string;
  phoneNumber: string;
  amount: number;
  planName?: string;
  isDataPlan?: boolean;
  transactionId?: string;
  completedAt?: string;
}

export function AirtimeReceipt({ data }: { data: AirtimeReceiptData }) {
  const { toast } = useToast();
  const networkInfo = networks[data.network];
  const NetworkLogo = networkInfo?.Logo || Smartphone;
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <div ref={receiptRef}>
        <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20 overflow-visible min-h-[380px] relative">
      <Watermark variant="center" opacity={0.06} maxSize="w-96 h-96" />
      <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10">
        <CardTitle className="text-lg font-bold">{data.isDataPlan || data.planName ? 'Data Purchased' : 'Airtime Purchased'}</CardTitle>
        <Smartphone className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 bg-card text-card-foreground relative z-10">
        <div className="text-center space-y-2 mb-6">
          <NetworkLogo className="mx-auto w-16 h-16" />
          <p className="text-sm text-muted-foreground">{networkInfo?.name} {data.isDataPlan || data.planName ? 'Data' : 'Airtime'}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-semibold">{networkInfo?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone Number</span>
            <span className="font-semibold">{data.phoneNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          {data.planName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{data.planName}</span>
            </div>
          )}
          {data.transactionId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0, 12)}...</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="font-semibold text-xs">
              {data.completedAt ? new Date(data.completedAt).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
        <CardFooter className="flex-col gap-2 p-4 pt-0 relative z-10">
        <p data-powered-by="ovomonie" className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
        <Button className="w-full" onClick={() => setIsShareOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" /> Share Receipt
        </Button>
      </CardFooter>
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={`Airtime Receipt`} />
    </>
  );
}
