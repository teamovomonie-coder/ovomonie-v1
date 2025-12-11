"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VirtualCardReceipt({ data, transactionId, onReset }: { data: any; transactionId?: string; onReset?: () => void }) {
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="p-6 text-center">
          <CardTitle className="text-lg font-bold">Virtual Card Created</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-sm text-muted-foreground">Card ID</div>
          <div className="font-mono text-sm">{data?.cardId}</div>

          <div className="text-sm text-muted-foreground">Card Number</div>
          <div className="font-mono text-lg">{data?.cardNumber}</div>

          <div className="flex justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Expiry</div>
              <div className="font-mono">{data?.expiryDate}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">CVV</div>
              <div className="font-mono">{data?.cvv}</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">Transaction: {transactionId}</div>
        </CardContent>
        <CardFooter className="flex gap-2 p-4">
          <Button variant="outline" onClick={() => handleCopy(data?.cardNumber || '', 'Card Number')} className="flex-1">
            <Copy className="mr-2" /> Copy Number
          </Button>
          <Button onClick={() => { toast({ title: 'Shared', description: 'Sharing not implemented in this demo.' }); }} className="flex-1">
            <Share2 className="mr-2" /> Share
          </Button>
        </CardFooter>
        <div className="p-4">
          <Button variant="ghost" className="w-full" onClick={onReset}>Done</Button>
        </div>
      </Card>
    </div>
  );
}
