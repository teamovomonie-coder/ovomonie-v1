"use client";

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Share2 } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';
import { useToast } from '@/hooks/use-toast';
import { nigerianBanks } from '@/lib/banks';
import { motion } from 'framer-motion';

type ReceiptData = {
  bankCode: string;
  accountNumber: string;
  amount: number;
  narration?: string | null;
  message?: string | null;
  photo?: string | null;
};

export default function MemoReceipt({ data, recipientName, onReset, transactionId, date, isInternalTransfer }: { data: ReceiptData; recipientName: string; onReset: () => void; transactionId?: string; date?: string; isInternalTransfer?: boolean }) {
  const { toast } = useToast();
  const bankName = isInternalTransfer ? 'Ovomonie' : (nigerianBanks.find(b => b.code === data.bankCode)?.name || 'Unknown Bank');

  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <motion.div 
        ref={receiptRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="w-full max-w-xs mx-auto rounded-xl p-2" style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.14)' }}>
          <Card className="w-full border-0 relative bg-white transform hover:-translate-y-1 transition-all duration-300" style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.25)' }}>
            <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-lg font-bold">Transfer Successful!</h2>
        <Landmark className="w-6 h-6" />
      </div>
      <CardContent className="p-4 bg-card">
        <div className="border-2 border-primary-light-bg rounded-lg p-4 space-y-4 relative z-10">
          {data.photo && (
            <div className="relative w-full h-56 mb-4 rounded-lg overflow-hidden">
              <Image src={data.photo as string} alt="Memorable moment" fill style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">You sent</p>
            <p className="text-4xl font-bold text-foreground">₦{data.amount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">to</p>
            <p className="text-lg font-semibold text-foreground">{recipientName}</p>
            <p className="text-sm text-muted-foreground">{bankName}</p>
          </div>
          {data.message && (
            <blockquote className="mt-4 border-l-4 border-primary/20 pl-4 italic text-center text-muted-foreground">"{data.message}"</blockquote>
          )}
          <div className="text-xs text-muted-foreground pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Date</span>
              <span>{date || new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Ref ID</span>
              <span className="font-mono text-sm">{transactionId || `OVO-EXT-${Date.now()}`}</span>
            </div>
          </div>
        </div>
      </CardContent>
          <CardFooter className="flex flex-col gap-2 p-4 pt-0">
            <p data-powered-by="ovomonie" className="text-xs text-muted-foreground mb-2">Powered by Ovomonie</p>
            <div className="no-capture space-y-2">
              <Button className="w-full" onClick={() => setIsShareOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" /> Share Receipt
              </Button>
              <Button variant="outline" className="w-full" onClick={onReset}>
                Make Another Transfer
              </Button>
            </div>
          </CardFooter>
        </Card>
          </div>
        </motion.div>
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} targetRef={receiptRef} title={`Transfer Receipt`} />
    </>
  );
}
