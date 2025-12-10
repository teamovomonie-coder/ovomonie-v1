"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Watermark from '@/components/transaction/watermark';
import { Share2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useRef, useState } from 'react';
import ShareModal from '@/components/transaction/share-modal';

const Bet9jaLogo = ({ className }: { className?: string }) => (
  <div className={`w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs ${className || ''}`}>B9</div>
);
const SportyBetLogo = ({ className }: { className?: string }) => (
  <div className={`w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs ${className || ''}`}>S</div>
);
const BetKingLogo = ({ className }: { className?: string }) => (
  <div className={`w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ${className || ''}`}>BK</div>
);
const OneXBetLogo = ({ className }: { className?: string }) => (
  <div className={`w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs ${className || ''}`}>1X</div>
);
const NairaBetLogo = ({ className }: { className?: string }) => (
  <div className={`w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xs ${className || ''}`}>NB</div>
);

const bettingPlatforms: Record<string, { name: string; Logo: React.FC<{ className?: string }> }> = {
  bet9ja: { name: 'Bet9ja', Logo: Bet9jaLogo },
  sportybet: { name: 'SportyBet', Logo: SportyBetLogo },
  betking: { name: 'BetKing', Logo: BetKingLogo },
  '1xbet': { name: '1xBet', Logo: OneXBetLogo },
  nairabet: { name: 'NairaBet', Logo: NairaBetLogo },
};

export interface BettingReceiptData {
  type: 'betting';
  platform: string;
  accountId: string;
  amount: number;
  recipientName?: string;
  transactionId?: string;
  completedAt?: string;
}

export function BettingReceipt({ data }: { data: BettingReceiptData }) {
  const { toast } = useToast();
  const platformInfo = bettingPlatforms[data.platform];
  const PlatformLogo = platformInfo?.Logo || Wallet;
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <div ref={receiptRef}>
        <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20 overflow-visible min-h-[380px] relative">
      <Watermark variant="center" opacity={0.06} maxSize="w-96 h-96" />
      <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10">
        <CardTitle className="text-lg font-bold">Betting Funded</CardTitle>
        <Wallet className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 bg-card text-card-foreground relative z-10">
        <div className="text-center space-y-2 mb-6">
          <PlatformLogo className="mx-auto w-16 h-16" />
          <p className="text-sm text-muted-foreground">{platformInfo?.name} Wallet</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-semibold">{platformInfo?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          {data.recipientName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{data.recipientName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
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
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={`${platformInfo?.name || 'Betting'} Receipt`} />
    </>
  );
}
