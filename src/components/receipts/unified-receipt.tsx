"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, ArrowLeftRight, Gamepad2, Zap, Smartphone, Landmark } from 'lucide-react';
import ShareModal from '@/components/transaction/share-modal';
import { useRouter } from 'next/navigation';
import { OvoLogo } from '@/components/layout/logo';
import { motion } from 'framer-motion';

interface ReceiptTemplate {
  template_type: 'betting' | 'utility' | 'airtime' | 'internal-transfer' | 'external-transfer' | 'memo-transfer';
  template_name: string;
  template_config: {
    title: string;
    icon: string;
    color: string;
  };
}

interface ReceiptData {
  template: ReceiptTemplate;
  data: {
    [key: string]: any;
    amount: number;
    transactionId: string;
    completedAt: string;
  };
}

const ICONS = {
  gamepad: Gamepad2,
  zap: Zap,
  smartphone: Smartphone,
  landmark: Landmark,
};

interface UnifiedReceiptProps {
  receipt: ReceiptData;
  onReset?: () => void;
}

export function UnifiedReceipt({ receipt, onReset }: UnifiedReceiptProps) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Debug: Log the receipt data
  console.log('[UnifiedReceipt] Receipt data:', receipt);

  const Icon = ICONS[receipt.template.template_config.icon as keyof typeof ICONS] || ArrowLeftRight;
  const isTransfer = receipt.template.template_type.includes('transfer');
  const amount = receipt.data.amount || 0;
  const transactionId = receipt.data.transactionId || 'N/A';
  const completedAt = receipt.data.completedAt ? new Date(receipt.data.completedAt).toLocaleString() : new Date().toLocaleString();

  console.log('[UnifiedReceipt] Parsed values:', { amount, transactionId, network: receipt.data.network, phoneNumber: receipt.data.phoneNumber });

  // Get title based on receipt type
  const getTitle = () => {
    switch (receipt.template.template_type) {
      case 'betting':
        return 'Betting Payment Successful';
      case 'utility':
        return 'Bill Payment Successful';
      case 'airtime':
        return 'Purchase Successful';
      case 'internal-transfer':
        return 'Internal Transfer Successful';
      case 'external-transfer':
        return 'External Bank Transfer';
      case 'memo-transfer':
        return 'Memo Transfer Successful';
      default:
        return 'Transaction Successful';
    }
  };

  // Get subtitle based on receipt type
  const getSubtitle = () => {
    switch (receipt.template.template_type) {
      case 'betting':
        return 'Betting Payment';
      case 'utility':
        return 'Utility Bill Payment';
      case 'airtime':
        return 'Airtime/Data Purchase';
      case 'internal-transfer':
        return 'Internal Transfer';
      case 'external-transfer':
        return 'External Bank Transfer';
      case 'memo-transfer':
        return 'Memo Transfer';
      default:
        return 'Transaction';
    }
  };

  // Get detail fields based on receipt type
  const getDetailFields = () => {
    const fields: Array<{ label: string; value: string | number | undefined }> = [];

    switch (receipt.template.template_type) {
      case 'betting':
        fields.push(
          { label: 'Platform', value: receipt.data.platform },
          { label: 'Account ID', value: receipt.data.accountId },
          { label: 'Reference', value: transactionId },
          { label: 'Date & Time', value: completedAt }
        );
        break;

      case 'utility':
        fields.push(
          { label: 'Service Provider', value: receipt.data.biller },
          { label: 'Meter/Account Number', value: receipt.data.accountId },
          { label: 'Account Name', value: receipt.data.verifiedName },
          { label: 'Reference', value: transactionId },
          { label: 'Date & Time', value: completedAt }
        );
        break;

      case 'airtime':
        fields.push(
          { label: 'Network', value: receipt.data.network },
          { label: 'Phone Number', value: receipt.data.phoneNumber },
          { label: 'Plan', value: receipt.data.planName },
          { label: 'Reference', value: transactionId },
          { label: 'Date & Time', value: completedAt }
        );
        break;

      case 'internal-transfer':
      case 'external-transfer':
      case 'memo-transfer':
        fields.push(
          { label: 'Recipient', value: receipt.data.recipientName },
          { label: 'Bank', value: receipt.data.bankName },
          { label: 'Account', value: receipt.data.accountNumber },
          { label: 'Narration', value: receipt.data.narration || receipt.data.message },
          { label: 'Reference', value: transactionId },
          { label: 'Date & Time', value: completedAt }
        );
        if (receipt.data.balanceAfter !== undefined) {
          fields.push({ label: 'Balance After', value: `₦${receipt.data.balanceAfter.toLocaleString()}` });
        }
        break;

      default:
        fields.push(
          { label: 'Reference', value: transactionId },
          { label: 'Date & Time', value: completedAt }
        );
    }

    return fields.filter(field => field.value !== undefined && field.value !== null && field.value !== '');
  };

  const detailFields = getDetailFields();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        ref={receiptRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-[#13284d] text-white p-6 text-center relative">
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
                <Icon className="w-3 h-3 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">{getTitle()}</h2>
            <p className="text-blue-100 text-sm">{getSubtitle()}</p>
            <div className="flex justify-center my-3">
              <OvoLogo width={40} height={40} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">₦{amount.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2 text-green-300">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-sm">Completed</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                {isTransfer ? 'Transfer Details' : 
                 receipt.template.template_type === 'betting' ? 'Payment Details' :
                 receipt.template.template_type === 'utility' ? 'Bill Payment Details' :
                 receipt.template.template_type === 'airtime' ? 'Purchase Details' :
                 'Transaction Details'}
              </h3>
              <div className="space-y-2 text-sm">
                {detailFields.map((field, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{field.label}</span>
                    <span className="font-semibold text-right">
                      {typeof field.value === 'number' 
                        ? field.value.toLocaleString() 
                        : field.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Energy Token Section (for utility bills) */}
              {receipt.template.template_type === 'utility' && 
               (receipt.data.token || receipt.data.KCT1 || receipt.data.KCT2) && (
                <div className="mt-4 space-y-2 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-green-800 dark:text-green-200">Energy Token</p>
                  {receipt.data.KCT1 && receipt.data.KCT2 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">KCT1:</span>
                        <code className="text-sm font-mono font-bold">{receipt.data.KCT1}</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">KCT2:</span>
                        <code className="text-sm font-mono font-bold">{receipt.data.KCT2}</code>
                      </div>
                    </div>
                  )}
                  {receipt.data.token && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Token:</span>
                      <code className="text-sm font-mono font-bold">{receipt.data.token}</code>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {receipt.data.KCT1 && receipt.data.KCT2 
                      ? 'Enter KCT1, then KCT2, then your token on your meter' 
                      : 'Enter this token on your meter to load energy'}
                  </p>
                </div>
              )}

              {/* Memo Message (for memo transfers) */}
              {receipt.template.template_type === 'memo-transfer' && receipt.data.message && (
                <div className="mt-4 border-l-4 border-primary/20 pl-4 italic text-center text-muted-foreground">
                  "{receipt.data.message}"
                </div>
              )}
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
                    onClick={() => {
                      if (onReset) onReset();
                      else router.push('/dashboard');
                    }}
                  >
                    {isTransfer ? 'Transfer Again' : 'Done'}
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
        </div>
      </motion.div>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title={getTitle()} 
      />
    </div>
  );
}

