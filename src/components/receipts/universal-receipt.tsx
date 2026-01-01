"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Gamepad2, Zap, Smartphone, Landmark } from 'lucide-react';
import React, { useRef, useState } from 'react';
import ShareModal from '@/components/transaction/share-modal';
import { motion } from 'framer-motion';

interface ReceiptTemplate {
  id: string;
  template_type: 'betting' | 'utility' | 'airtime' | 'internal-transfer' | 'external-transfer' | 'memo-transfer';
  template_name: string;
  template_config: {
    title: string;
    icon: string;
    color: string;
    fields: Array<{
      key: string;
      label: string;
      type: 'text' | 'currency' | 'phone' | 'reference' | 'datetime' | 'token';
      optional?: boolean;
    }>;
  };
}

interface ReceiptData {
  [key: string]: any;
  amount: number;
  transactionId: string;
  completedAt: string;
}

interface UniversalReceiptProps {
  template: ReceiptTemplate;
  data: ReceiptData;
}

const ICONS = {
  gamepad: Gamepad2,
  zap: Zap,
  smartphone: Smartphone,
  landmark: Landmark,
};

export function UniversalReceipt({ template, data }: UniversalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const Icon = ICONS[template.template_config.icon as keyof typeof ICONS] || Zap;

  const formatValue = (value: any, type: string) => {
    if (!value) return '';
    
    switch (type) {
      case 'currency':
        return `₦${Number(value).toLocaleString()}`;
      case 'reference':
        return String(value).slice(0, 12) + '...';
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'phone':
        return String(value);
      case 'token':
        return String(value);
      default:
        return String(value);
    }
  };

  const getMainDisplayInfo = () => {
    if (template.template_type.includes('transfer')) {
      return {
        subtitle: 'You sent',
        amount: data.amount,
        recipient: data.recipientName || 'Recipient',
        bank: data.bankName || 'Bank'
      };
    } else {
      return {
        subtitle: data.network || data.biller || data.platform || 'Service Provider',
        amount: data.amount,
        recipient: null,
        bank: null
      };
    }
  };

  const displayInfo = getMainDisplayInfo();

  return (
    <>
      <motion.div 
        ref={receiptRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="w-full max-w-xs mx-auto rounded-xl p-2" style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.14)', width: '320px' }}>
          <Card className="w-full border-0 relative bg-white transform hover:-translate-y-1 transition-all duration-300" style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.25)' }}>
            <div 
              className="text-primary-foreground p-4 rounded-t-lg flex justify-between items-center"
              style={{ backgroundColor: template.template_config.color }}
            >
              <h2 className="text-lg font-bold">{template.template_config.title}</h2>
              <Icon className="w-6 h-6" />
            </div>
            <CardContent className="p-4 bg-card">
              <div className="border-2 border-primary-light-bg rounded-lg p-4 space-y-4 relative z-10">
                <div className="text-center space-y-1">
                  {displayInfo.subtitle && (
                    <p className="text-sm text-muted-foreground">{displayInfo.subtitle}</p>
                  )}
                  <p className="text-4xl font-bold text-foreground">₦{displayInfo.amount.toLocaleString()}</p>
                  {displayInfo.recipient && (
                    <>
                      <p className="text-sm text-muted-foreground">to</p>
                      <p className="text-lg font-semibold text-foreground">{displayInfo.recipient}</p>
                      {displayInfo.bank && (
                        <p className="text-sm text-muted-foreground">{displayInfo.bank}</p>
                      )}
                    </>
                  )}
                </div>
                
                {/* Special message display for memo transfers */}
                {template.template_type === 'memo-transfer' && data.message && (
                  <blockquote className="mt-4 border-l-4 border-primary/20 pl-4 italic text-center text-muted-foreground">
                    "{data.message}"
                  </blockquote>
                )}
                
                {/* Special token display for utility bills */}
                {template.template_type === 'utility' && (data.token || data.KCT1 || data.KCT2) && (
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
                )}
                
                <div className="text-xs text-muted-foreground pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span>{formatValue(data.completedAt, 'datetime')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ref ID</span>
                    <span className="font-mono text-sm">{formatValue(data.transactionId, 'reference')}</span>
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
              </div>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title={`${template.template_name} Receipt`} 
      />
    </>
  );
}