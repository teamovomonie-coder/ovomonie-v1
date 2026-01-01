<<<<<<< HEAD
"use client";

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useRef, useState } from 'react';
import ShareModal from '@/components/transaction/share-modal';
import { useRouter } from 'next/navigation';
import { OvoLogo } from '@/components/layout/logo';

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
  const router = useRouter();
  const platformInfo = bettingPlatforms[data.platform];
  const PlatformLogo = platformInfo?.Logo || Wallet;
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <div ref={receiptRef} className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-[#13284d] text-white p-6 text-center relative">
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
                <Wallet className="w-3 h-3" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">Transfer Successful</h2>
            <p className="text-blue-100 text-sm">Betting Wallet Funding</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2 text-green-300">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-sm">Completed</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Transfer Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform</span>
                  <span className="font-semibold text-right">{platformInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account ID</span>
                  <span className="font-semibold text-right">{data.accountId}</span>
                </div>
                {data.recipientName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Name</span>
                    <span className="font-semibold text-right">{data.recipientName}</span>
                  </div>
                )}
                {data.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference</span>
                    <span className="font-mono text-xs font-semibold">{data.transactionId.slice(0, 12)}...</span>
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
                    onClick={() => router.push('/betting')}
                  >
                    Fund Again
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={`${platformInfo?.name || 'Betting'} Receipt`} />
    </>
  );
}
=======
import { Card } from "@/components/ui/card";

export function BettingReceipt({ receipt }: { receipt: any }) {
  return (
    <Card className="p-4">
      <h3 className="font-bold">Betting Receipt</h3>
      <p>Transaction ID: {receipt.data.transactionId}</p>
      <p>Amount: ₦{receipt.data.amount.toLocaleString()}</p>
    </Card>
  );
}
>>>>>>> 60b69d28b5a5eb107ed1b8de302530feed5bd241
