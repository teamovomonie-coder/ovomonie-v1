"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Watermark from '@/components/transaction/watermark';
import { Zap, Tv, Wifi, Droplet, Trophy, Receipt, Phone } from 'lucide-react';
import type { ReceiptData } from '@/lib/receipt-templates';

const ICONS = { zap: Zap, tv: Tv, wifi: Wifi, droplet: Droplet, trophy: Trophy, receipt: Receipt, phone: Phone };

export function UtilityReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Zap;

  return (
    <Card className="w-full shadow-lg border-2 overflow-visible relative" style={{ borderColor: template.color_scheme.secondary }}>
      <Watermark variant="center" opacity={0.06} />
      <CardHeader className="text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10" style={{ backgroundColor: template.color_scheme.primary }}>
        <CardTitle className="text-lg font-bold">{template.template_name}</CardTitle>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Meter Number</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          {data.verifiedName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{data.verifiedName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        </div>
        {(data.token || data.KCT1) && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: template.color_scheme.accent }}>
              <p className="text-xs font-semibold" style={{ color: template.color_scheme.primary }}>⚡ Energy Token</p>
              {data.KCT1 && data.KCT2 && (
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-xs">KCT1:</span><code className="text-sm font-mono font-bold">{data.KCT1}</code></div>
                  <div className="flex justify-between"><span className="text-xs">KCT2:</span><code className="text-sm font-mono font-bold">{data.KCT2}</code></div>
                </div>
              )}
              {data.token && <div className="flex justify-between"><span className="text-xs">Token:</span><code className="text-sm font-mono font-bold">{data.token}</code></div>}
              <p className="text-xs text-muted-foreground mt-2">{data.KCT1 ? 'Enter KCT1, KCT2, then token on meter' : 'Enter token on meter'}</p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
      </CardFooter>
    </Card>
  );
}

export function CableTVReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Tv;

  return (
    <Card className="w-full shadow-lg border-2 overflow-visible relative" style={{ borderColor: template.color_scheme.secondary }}>
      <Watermark variant="center" opacity={0.06} />
      <CardHeader className="text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10" style={{ backgroundColor: template.color_scheme.primary }}>
        <CardTitle className="text-lg font-bold">{template.template_name}</CardTitle>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Smart Card</span>
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
              <span className="font-semibold">{data.bouquet.name || data.bouquet}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
      </CardFooter>
    </Card>
  );
}

export function InternetReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Wifi;

  return (
    <Card className="w-full shadow-lg border-2 overflow-visible relative" style={{ borderColor: template.color_scheme.secondary }}>
      <Watermark variant="center" opacity={0.06} />
      <CardHeader className="text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10" style={{ backgroundColor: template.color_scheme.primary }}>
        <CardTitle className="text-lg font-bold">{template.template_name}</CardTitle>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Number</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          {data.verifiedName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{data.verifiedName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
      </CardFooter>
    </Card>
  );
}

export function BettingReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Trophy;

  return (
    <Card className="w-full shadow-lg border-2 overflow-visible relative" style={{ borderColor: template.color_scheme.secondary }}>
      <Watermark variant="center" opacity={0.06} />
      <CardHeader className="text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10" style={{ backgroundColor: template.color_scheme.primary }}>
        <CardTitle className="text-lg font-bold">{template.template_name}</CardTitle>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          {data.verifiedName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{data.verifiedName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Funded</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
      </CardFooter>
    </Card>
  );
}



export function AirtimeDataReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Phone;
  const isData = template.category === 'data';
  
  // Network logo mapping
  const getNetworkLogo = (network: string) => {
    const networkLower = network?.toLowerCase() || '';
    if (networkLower.includes('mtn')) return '/mtn.jpg';
    if (networkLower.includes('airtel')) return '/airtel.png';
    if (networkLower.includes('glo')) return '/glo.png';
    if (networkLower.includes('9mobile') || networkLower.includes('t2')) return '/t2.png';
    return null;
  };
  
  const networkLogo = getNetworkLogo(data.biller.name);

  return (
    <Card className="w-full shadow-lg border-2 overflow-visible relative" style={{ borderColor: template.color_scheme.secondary }}>
      <Watermark variant="center" opacity={0.06} />
      <CardHeader className="text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10" style={{ backgroundColor: template.color_scheme.primary }}>
        <CardTitle className="text-lg font-bold">{template.template_name}</CardTitle>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-2 mb-6">
          {networkLogo && (
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center p-2 shadow-md">
                <img src={networkLogo} alt={data.biller.name} className="w-full h-full object-contain" />
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone Number</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-semibold">{data.biller.name}</span>
          </div>
          {isData && data.planName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Plan</span>
              <span className="font-semibold">{data.planName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-xs font-mono">{data.transactionId?.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
      </CardFooter>
    </Card>
  );
}

export function GenericReceipt({ receipt }: { receipt: ReceiptData }) {
  const { template, data } = receipt;
  const Icon = ICONS[template.icon as keyof typeof ICONS] || Receipt;

  return (
    <Card className="w-full shadow-lg border-2 overflow-visible relative" style={{ borderColor: template.color_scheme.secondary }}>
      <Watermark variant="center" opacity={0.06} />
      <CardHeader className="text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0 relative z-10" style={{ backgroundColor: template.color_scheme.primary }}>
        <CardTitle className="text-lg font-bold">{template.template_name}</CardTitle>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-muted-foreground">{data.biller.name}</p>
          <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account</span>
            <span className="font-semibold">{data.accountId}</span>
          </div>
          {data.verifiedName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold">{data.verifiedName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-xs font-mono">{data.transactionId.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold text-xs">{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground text-center w-full">Powered by Ovomonie</p>
      </CardFooter>
    </Card>
  );
}
