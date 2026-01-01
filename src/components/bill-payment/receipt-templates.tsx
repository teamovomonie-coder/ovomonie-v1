"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2 } from 'lucide-react';
import { Zap, Tv, Wifi, Droplet, Trophy, Receipt, Phone } from 'lucide-react';
import type { ReceiptData } from '@/lib/receipt-templates';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import ShareModal from '@/components/transaction/share-modal';
import { OvoLogo } from '@/components/layout/logo';

const ICONS = { zap: Zap, tv: Tv, wifi: Wifi, droplet: Droplet, trophy: Trophy, receipt: Receipt, phone: Phone };

// Unified Receipt Component
function UnifiedReceipt({ 
  receipt, 
  title, 
  accountLabel = "Account", 
  additionalFields = [], 
  networkLogo 
}: { 
  receipt: ReceiptData;
  title: string;
  accountLabel?: string;
  additionalFields?: Array<{ label: string; value: string }>;
  networkLogo?: string | null;
}) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Receipt;

<<<<<<< HEAD
  return (
    <>
      <div ref={receiptRef} className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-[#13284d] text-white p-6 text-center relative">
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
                <Icon className="w-3 h-3" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            <p className="text-blue-100 text-sm">{template.template_name}</p>
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
                {data.verifiedName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <span className="font-semibold text-right">{data.verifiedName}</span>
                  </div>
                )}
                {data.biller?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank</span>
                    <span className="font-semibold text-right">{data.biller.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{accountLabel}</span>
                  <span className="font-semibold text-right">{data.accountId}</span>
                </div>
                {additionalFields.map((field, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{field.label}</span>
                    <span className="font-semibold text-right">{field.value}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-mono text-xs font-semibold">{data.transactionId?.slice(0, 12) || 'N/A'}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-semibold text-right text-xs">{new Date(data.completedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Special content for utility receipts with tokens */}
            {(data.token || data.KCT1) && (
              <div className="p-4 border-t">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">⚡ Energy Token</p>
                  {data.KCT1 && data.KCT2 && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>KCT1:</span>
                        <code className="font-mono font-bold">{data.KCT1}</code>
                      </div>
                      <div className="flex justify-between">
                        <span>KCT2:</span>
                        <code className="font-mono font-bold">{data.KCT2}</code>
                      </div>
                    </div>
                  )}
                  {data.token && (
                    <div className="flex justify-between text-xs">
                      <span>Token:</span>
                      <code className="font-mono font-bold">{data.token}</code>
                    </div>
                  )}
                  <p className="text-xs text-yellow-700 mt-2">
                    {data.KCT1 ? 'Enter KCT1, KCT2, then token on meter' : 'Enter token on meter'}
                  </p>
                </div>
              </div>
            )}
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
                    onClick={() => router.push('/transfer')}
                  >
                    Transfer Again
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title={`${title} Receipt`} 
      />
    </>
  );
}

export function UtilityReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Meter Number"
    />
  );
}

export function CableTVReceipt({ receipt }: { receipt: ReceiptData }) {
  const { data } = receipt;
  const additionalFields = [];
  if (data.bouquet) {
    additionalFields.push({ label: 'Package', value: data.bouquet.name || data.bouquet });
  }
  
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Smart Card"
      additionalFields={additionalFields}
    />
  );
}

export function InternetReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Account Number"
    />
  );
}

export function BettingReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Account ID"
    />
  );
}

export function AirtimeDataReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const isData = template.category === 'data';
  const additionalFields = [];
  
  if (isData && data.planName) {
    additionalFields.push({ label: 'Data Plan', value: data.planName });
  }
  
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Phone Number"
      additionalFields={additionalFields}
    />
  );
}

export function GenericReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Account"
    />
  );
}

=======
  // Generate unique key for this receipt to prevent caching issues
  const receiptKey = `${data.transactionId}-${data.completedAt}-${data.amount}`;

  return (
    <>
      <div key={receiptKey} ref={receiptRef} className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-[#13284d] text-white p-6 text-center relative">
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-[#13284d] rounded-full flex items-center justify-center">
                <Icon className="w-3 h-3" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            <p className="text-blue-100 text-sm">{template.template_name}</p>
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
                {data.verifiedName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <span className="font-semibold text-right">{data.verifiedName}</span>
                  </div>
                )}
                {data.biller?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank</span>
                    <span className="font-semibold text-right">{data.biller.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{accountLabel}</span>
                  <span className="font-semibold text-right">{data.accountId}</span>
                </div>
                {additionalFields.map((field, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{field.label}</span>
                    <span className="font-semibold text-right">{field.value}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-mono text-xs font-semibold">{data.transactionId?.slice(0, 12) || 'N/A'}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-semibold text-right text-xs">{new Date(data.completedAt).toLocaleString()}</span>
                </div>
                {data.balanceAfter !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance After</span>
                    <span className="font-semibold text-right">₦{data.balanceAfter.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Special content for utility receipts with tokens */}
            {(data.token || data.KCT1) && (
              <div className="p-4 border-t">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">⚡ Energy Token</p>
                  {data.KCT1 && data.KCT2 && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>KCT1:</span>
                        <code className="font-mono font-bold">{data.KCT1}</code>
                      </div>
                      <div className="flex justify-between">
                        <span>KCT2:</span>
                        <code className="font-mono font-bold">{data.KCT2}</code>
                      </div>
                    </div>
                  )}
                  {data.token && (
                    <div className="flex justify-between text-xs">
                      <span>Token:</span>
                      <code className="font-mono font-bold">{data.token}</code>
                    </div>
                  )}
                  <p className="text-xs text-yellow-700 mt-2">
                    {data.KCT1 ? 'Enter KCT1, KCT2, then token on meter' : 'Enter token on meter'}
                  </p>
                </div>
              </div>
            )}
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
                    onClick={() => router.push('/transfer')}
                  >
                    Transfer Again
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        targetRef={receiptRef} 
        title={`${title} Receipt`} 
      />
    </>
  );
}

export function UtilityReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Meter Number"
    />
  );
}

export function CableTVReceipt({ receipt }: { receipt: ReceiptData }) {
  const { data } = receipt;
  const additionalFields = [];
  if (data.bouquet) {
    additionalFields.push({ label: 'Package', value: data.bouquet.name || data.bouquet });
  }
  
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Smart Card"
      additionalFields={additionalFields}
    />
  );
}

export function InternetReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Account Number"
    />
  );
}

export function BettingReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Account ID"
    />
  );
}

export function AirtimeDataReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const isData = template.category === 'data';
  const additionalFields = [];
  
  if (isData && data.planName) {
    additionalFields.push({ label: 'Data Plan', value: data.planName });
  }
  
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Phone Number"
      additionalFields={additionalFields}
    />
  );
}

export function GenericReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <UnifiedReceipt 
      receipt={receipt}
      title="Transfer Successful"
      accountLabel="Account"
    />
  );
}

>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c

