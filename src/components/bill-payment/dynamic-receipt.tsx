"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';
import type { ReceiptData } from '@/lib/receipt-templates';
import { UtilityReceipt, CableTVReceipt, InternetReceipt, BettingReceipt, AirtimeDataReceipt, GenericReceipt } from './receipt-templates';

interface DynamicReceiptProps {
  receipt: ReceiptData;
}

export function DynamicReceipt({ receipt }: DynamicReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const category = receipt.template.category.toLowerCase();

  const ReceiptComponent = 
    category === 'utility' ? UtilityReceipt :
    category === 'cable tv' ? CableTVReceipt :
    category === 'internet subscription' ? InternetReceipt :
    category === 'betting' ? BettingReceipt :
    category === 'airtime' || category === 'data' ? AirtimeDataReceipt :
    GenericReceipt;

  // Generate unique key to force re-render with new data
  const receiptKey = `${receipt.data.transactionId}-${receipt.data.completedAt}-${receipt.data.amount}`;

  return (
    <div key={receiptKey} className="w-full max-w-md mx-auto space-y-4">
      <div ref={receiptRef}>
        <ReceiptComponent receipt={receipt} />
      </div>
      <Button className="w-full no-capture" onClick={() => setIsShareOpen(true)}>
        <Share2 className="mr-2 h-4 w-4" /> Share Receipt
      </Button>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title={`${receipt.data.biller.name} Receipt`}
      />
    </div>
  );
}
