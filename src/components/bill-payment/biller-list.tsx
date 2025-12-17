
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription as UICardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Tv, Wifi, Droplet, Search, Loader2, Share2, CheckCircle, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { PinModal } from '@/components/auth/pin-modal';
import { Separator } from '@/components/ui/separator';
import { pendingTransactionService } from '@/lib/pending-transaction-service';

interface Biller {
  id: string;
  name: string;
  icon: LucideIcon;
  category: 'Electricity' | 'Cable TV' | 'Internet' | 'Water';
  fieldLabel: string;
  placeholder: string;
}

interface Bouquet {
  id: string;
  name: string;
  price: number;
}

interface ReceiptData {
  biller: Biller;
  amount: number;
  accountId: string;
  verifiedName: string | null;
  bouquet?: Bouquet;
}

const allBillers: Biller[] = [
  { id: 'ikedc', name: 'Ikeja Electric (IKEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your IKEDC number' },
  { id: 'ekedc', name: 'Eko Electric (EKEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your EKEDC number' },
  { id: 'aedc', name: 'Abuja Electric (AEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your AEDC number' },
  { id: 'dstv', name: 'DStv', icon: Tv, category: 'Cable TV', fieldLabel: 'Smartcard Number', placeholder: 'Enter your DStv IUC/Smartcard' },
  { id: 'gotv', name: 'GOtv', icon: Tv, category: 'Cable TV', fieldLabel: 'IUC Number', placeholder: 'Enter your GOtv IUC number' },
  { id: 'startimes', name: 'StarTimes', icon: Tv, category: 'Cable TV', fieldLabel: 'Smartcard Number', placeholder: 'Enter your StarTimes Smartcard' },
  { id: 'spectranet', name: 'Spectranet', icon: Wifi, category: 'Internet', fieldLabel: 'User ID', placeholder: 'Enter your Spectranet User ID' },
  { id: 'smile', name: 'Smile', icon: Wifi, category: 'Internet', fieldLabel: 'Account ID', placeholder: 'Enter your Smile Account ID' },
  { id: 'lwc', name: 'Lagos Water Corp', icon: Droplet, category: 'Water', fieldLabel: 'Customer ID', placeholder: 'Enter your LWC Customer ID' },
];

const bouquets: Record<string, Bouquet[]> = {
  dstv: [
    { id: 'dstv-padi', name: 'DStv Padi', price: 3950 },
    { id: 'dstv-yanga', name: 'DStv Yanga', price: 7200 },
    { id: 'dstv-confam', name: 'DStv Confam', price: 12500 },
    { id: 'dstv-compact', name: 'DStv Compact', price: 15700 },
    { id: 'dstv-premium', name: 'DStv Premium', price: 37000 },
  ],
  gotv: [
    { id: 'gotv-smallie', name: 'GOtv Smallie', price: 1300 },
    { id: 'gotv-jinja', name: 'GOtv Jinja', price: 3300 },
    { id: 'gotv-jolli', name: 'GOtv Jolli', price: 4850 },
    { id: 'gotv-max', name: 'GOtv Max', price: 7200 },
    { id: 'gotv-supa', name: 'GOtv Supa+', price: 15700 },
  ],
  startimes: [
    { id: 'st-nova', name: 'Nova Bouquet', price: 1500 },
    { id: 'st-basic', name: 'Basic Bouquet', price: 2600 },
    { id: 'st-smart', name: 'Smart Bouquet', price: 3500 },
    { id: 'st-classic', name: 'Classic Bouquet', price: 3800 },
    { id: 'st-super', name: 'Super Bouquet', price: 6500 },
  ],
};

const mockSmartcards: Record<string, Record<string, string>> = {
  dstv: { '1234567890': 'JOHN DOE', '0987654321': 'JANE SMITH' },
  gotv: { '1122334455': 'FEMI ADEBOLA', '5544332211': 'CHIOMA OKOYE' },
  startimes: { '5566778899': 'MUSA ALIYU', '9988776655': 'AMINA YAKUBU' },
};

// Mock account mappings for utility billers (electricity, internet, water)
const mockUtilityAccounts: Record<string, Record<string, { name: string; address?: string; meterType?: string }>> = {
    ikedc: {
        '1100110011': { name: 'ADEBAYO OLA', address: '12 Awolowo Rd, Ikeja', meterType: 'Prepaid' },
        '2200220022': { name: 'MRS. IHEKWEM', address: '45 Allen Ave, Ikeja', meterType: 'Postpaid' },
    },
    ekedc: {
        '3300330033': { name: 'TUNDE SALAMI', address: '9 Victoria Is, Lagos', meterType: 'Prepaid' },
        '4400440044': { name: 'OLUCHI NWANKWO', address: '78 Ojota St, Lagos', meterType: 'Postpaid' },
    },
    aedc: {
        '5500550055': { name: 'OMOTAYO A.', address: '3 Garki, Abuja', meterType: 'Prepaid' },
    },
    spectranet: {
        'SPEC12345': { name: 'SPECTRANET USER', address: 'Tech Park, Lagos', meterType: 'Account' },
    },
    smile: {
        'SMILE0001': { name: 'SMILE CUSTOMER', address: 'Smile Plaza', meterType: 'Account' },
    },
    lwc: {
        'LWC-1001': { name: 'LAGOS HOUSEHOLD', address: 'Ikeja, Lagos', meterType: 'Customer' },
    },
};

const categories = [
    { name: 'Electricity', icon: Lightbulb },
    { name: 'Cable TV', icon: Tv },
    { name: 'Internet', icon: Wifi },
    { name: 'Water', icon: Droplet },
] as const;

interface PaymentData {
    amount: number;
    description: string;
}

function PaymentReceipt({ data, onDone }: { data: ReceiptData; onDone: () => void }) {
    const { toast } = useToast();
    const handleShare = () => {
        toast({ title: "Shared!", description: "Your receipt has been shared." });
    }
    const BillerIcon = data.biller.icon;

    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onDone()}>
            <DialogContent className="max-w-sm">
                 <DialogHeader className="text-center items-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
                    <DialogTitle className="text-2xl">Payment Successful</DialogTitle>
                    <DialogDescription>Your payment to {data.biller.name} was successful.</DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-bold text-lg">₦{data.amount.toLocaleString()}</span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Paid To</span>
                        <div className="flex items-center gap-2 font-semibold">
                            <BillerIcon className="w-4 h-4" />
                            <span>{data.biller.name}</span>
                        </div>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{data.biller.fieldLabel}</span>
                        <span className="font-semibold">{data.accountId}</span>
                    </div>
                    {data.verifiedName && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Account Name</span>
                            <span className="font-semibold">{data.verifiedName}</span>
                        </div>
                    )}
                     {data.bouquet && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Package</span>
                            <span className="font-semibold">{data.bouquet.name}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">{new Date().toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-semibold font-mono text-xs">OVO-BILL-{Date.now()}</span>
                    </div>
                </div>
                 <DialogFooter className="flex-col gap-2 pt-4 sm:flex-col sm:space-x-0">
                    <Button className="w-full" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" /> Share Receipt
                    </Button>
                    <Button variant="outline" className="w-full" onClick={onDone}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function BillerList() {
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].name);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const [verifiedInfo, setVerifiedInfo] = useState<{ name: string; address?: string; meterType?: string } | null>(null);
  const [selectedBouquetId, setSelectedBouquetId] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [dialogView, setDialogView] = useState<'form' | 'summary'>('form');
  const [apiError, setApiError] = useState<string | null>(null);

  const { toast } = useToast();
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
    const router = useRouter();


  const resetDialogState = () => {
    setSelectedBiller(null);
    setAmount('');
    setAccountId('');
    setIsVerifying(false);
    setIsSubmitting(false);
    setVerifiedName(null);
    setSelectedBouquetId('');
    setPaymentData(null);
    setIsPinModalOpen(false);
    setReceiptData(null);
    setDialogView('form');
  }
  
  const handleVerifySmartcard = async () => {
    if (!selectedBiller || !accountId) return;
    setIsVerifying(true);
    setVerifiedName(null);
    setVerifiedInfo(null);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    // Check cable TV smartcards first, otherwise try utility account mocks
    const providerSmartcards = mockSmartcards[selectedBiller.id];
    const providerAccounts = mockUtilityAccounts[selectedBiller.id];

    if (providerSmartcards && providerSmartcards[accountId]) {
        const name = providerSmartcards[accountId];
        setVerifiedName(name);
        setVerifiedInfo({ name });
    } else if (providerAccounts && providerAccounts[accountId]) {
        const info = providerAccounts[accountId];
        setVerifiedName(info.name);
        setVerifiedInfo(info);
    } else {
        toast({
            title: "Verification Failed",
            description: "Invalid account number. Please check and try again.",
            variant: "destructive"
        });
    }
    setIsVerifying(false);
  };

  const handleProceedToSummary = () => {
    if (selectedBiller?.category === 'Cable TV') {
        if (!verifiedName || !selectedBouquetId) {
            toast({ title: "Incomplete", description: "Please verify your account and select a package.", variant: "destructive" });
            return;
        }
    } else {
        if (!accountId || !amount || parseFloat(amount) <= 0) {
            toast({ title: "Incomplete", description: "Please enter a valid account ID and amount.", variant: "destructive" });
            return;
        }
    }
    setDialogView('summary');
  }

  const handlePayment = () => {
    let paymentAmount = 0;
    let description = '';

    if (selectedBiller?.category === 'Cable TV') {
        const bouquet = bouquets[selectedBiller.id]?.find(b => b.id === selectedBouquetId);
        if (!bouquet) {
            toast({ title: "Error", description: "Please select a bouquet.", variant: "destructive" });
            return;
        }
        paymentAmount = bouquet.price;
        description = `Payment for ${selectedBiller.name} (${bouquet.name}).`;
    } else {
         if (!amount || !accountId) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }
        paymentAmount = parseFloat(amount);
        description = `Payment for ${selectedBiller?.name}.`;
    }

    if (balance === null || (paymentAmount * 100) > balance) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this payment.' });
        return;
    }

    setPaymentData({ amount: paymentAmount, description });
    setIsPinModalOpen(true);
  };
  
  const handleConfirmPayment = async () => {
    if (!paymentData || !selectedBiller) return;
    setIsSubmitting(true);
    setApiError(null);

    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const clientReference = `bill-${crypto.randomUUID()}`;
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: paymentData.amount,
                category: selectedBiller.category.toLowerCase().replace(' ', '-'),
                narration: paymentData.description,
                party: {
                    name: selectedBiller.name,
                    billerId: accountId,
                }
            })
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Bill payment failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        addNotification({
            title: 'Bill Payment Successful',
            description: paymentData.description,
            category: 'transaction',
        });

                const bouquet = selectedBiller?.category === 'Cable TV' ? bouquets[selectedBiller.id].find(b => b.id === selectedBouquetId) : undefined;

                // Save pending receipt and navigate to /success
                const pendingReceipt = {
                    type: 'bill-payment' as const,
                    data: {
                        biller: { id: selectedBiller!.id, name: selectedBiller!.name },
                        amount: paymentData.amount,
                        accountId,
                        verifiedName: verifiedInfo?.name || verifiedName,
                        verifiedInfo: verifiedInfo || null,
                        bouquet: bouquet || null,
                    },
                    reference: clientReference,
                    amount: paymentData.amount,
                    transactionId: clientReference,
                    completedAt: new Date().toISOString(),
                };
                // Debug: log pending receipt payload to help diagnose malformed data issues
                try { console.debug('[BillerList] pendingReceipt', pendingReceipt); } catch (e) {}
                await pendingTransactionService.savePendingReceipt(pendingReceipt);
                setIsPinModalOpen(false);
                resetDialogState();
                router.push('/success');

    } catch (error: any) {
        let description = "An unknown error occurred.";
        if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
            description = error.message;
        }
        setApiError(description);
    } finally {
        setIsSubmitting(false);
    }
  }

  const filteredBillers = allBillers.filter(biller =>
    biller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter((cat) =>
    allBillers.some(
      (biller) =>
        biller.category === cat.name &&
        biller.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  useEffect(() => {
    // keep selected category valid when search narrows options
    if (!filteredCategories.find((c) => c.name === selectedCategory)) {
      const next = filteredCategories[0]?.name || categories[0].name;
      if (next !== selectedCategory) setSelectedCategory(next);
    }
  }, [filteredCategories, selectedCategory]);

  const renderDialogFormContent = () => {
    if (!selectedBiller) return null;

    if (selectedBiller.category === 'Cable TV') {
        const providerBouquets = bouquets[selectedBiller.id] || [];
        const selectedBouquet = providerBouquets.find(b => b.id === selectedBouquetId);
        
        return (
            <div className="grid gap-4 py-4">
                <Alert>
                    <Tv className="h-4 w-4" />
                    <AlertTitle>Testing Info</AlertTitle>
                    <UICardDescription>
                        Use smartcard numbers like 1234567890 (DStv), 1122334455 (GOtv), or 5566778899 (StarTimes) for successful verification.
                    </UICardDescription>
                </Alert>
                <div className="space-y-2">
                    <Label htmlFor="account-id">{selectedBiller.fieldLabel}</Label>
                    <div className="flex gap-2">
                        <Input id="account-id" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder={selectedBiller.placeholder} disabled={!!verifiedName} />
                        <Button onClick={handleVerifySmartcard} disabled={isVerifying || !accountId || !!verifiedName} className="w-32">
                            {isVerifying ? <Loader2 className="animate-spin" /> : "Verify"}
                        </Button>
                    </div>
                </div>

                {verifiedInfo && (
                    <div className="mt-3">
                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg shadow-sm ring-1 ring-green-100">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-full">
                                <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">{verifiedInfo.name}</div>
                                {verifiedInfo.address && <div className="text-xs text-muted-foreground">{verifiedInfo.address}</div>}
                                {verifiedInfo.meterType && <div className="text-xs text-muted-foreground mt-1"><span className="font-medium">Type:</span> {verifiedInfo.meterType}</div>}
                            </div>
                        </div>

                        <div className="space-y-2 mt-3">
                            <Label htmlFor="bouquet">Bouquet/Package</Label>
                            <Select onValueChange={setSelectedBouquetId} value={selectedBouquetId}>
                                <SelectTrigger id="bouquet">
                                    <SelectValue placeholder="Select a package" />
                                </SelectTrigger>
                                <SelectContent>
                                    {providerBouquets.map(bouquet => (
                                        <SelectItem key={bouquet.id} value={bouquet.id}>
                                            {bouquet.name} - ₦{bouquet.price.toLocaleString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedBouquet && (
                            <div className="text-right font-bold text-xl">
                                Total: ₦{selectedBouquet.price.toLocaleString()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid gap-4 py-4">
                        <Alert>
                                <AlertTitle>Testing Info</AlertTitle>
                                <UICardDescription>
                                        For testing, use one of the sample account numbers for {selectedBiller.name}: 
                                        <div className="mt-2">
                                                {mockUtilityAccounts[selectedBiller.id] ? Object.keys(mockUtilityAccounts[selectedBiller.id]).map(k => (
                                                        <div key={k} className="inline-block mr-2 px-2 py-1 bg-muted rounded text-xs">{k}</div>
                                                )) : <span className="text-muted-foreground">No sample accounts available for this provider.</span>}
                                        </div>
                                </UICardDescription>
                        </Alert>

                <div className="grid grid-cols-12 items-center gap-3">
                    <Label htmlFor="account-id" className="col-span-12 sm:col-span-4 text-sm font-medium">{selectedBiller.fieldLabel}</Label>
                    <div className="col-span-12 sm:col-span-8">
                        <div className="flex gap-2">
                            <Input id="account-id" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="flex-1" placeholder={selectedBiller.placeholder} />
                            <Button onClick={handleVerifySmartcard} disabled={isVerifying || !accountId || !!verifiedName} className="w-32">
                                {isVerifying ? <Loader2 className="animate-spin" /> : "Verify"}
                            </Button>
                        </div>

                        {verifiedInfo && (
                            <div className="mt-2">
                                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg shadow-sm ring-1 ring-green-100">
                                    <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-full">
                                        <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold">{verifiedInfo.name}</div>
                                        {verifiedInfo.address && <div className="text-xs text-muted-foreground">{verifiedInfo.address}</div>}
                                        {verifiedInfo.meterType && <div className="text-xs text-muted-foreground mt-1"><span className="font-medium">Type:</span> {verifiedInfo.meterType}</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-3">
                    <Label htmlFor="amount" className="col-span-12 sm:col-span-4 text-sm font-medium">Amount (₦)</Label>
                    <div className="col-span-12 sm:col-span-8">
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full" placeholder="Enter amount" />
                    </div>
                </div>
        </div>
    );
  };
  
  const renderDialogSummaryContent = () => {
    if (!selectedBiller) return null;
    let paymentAmount = 0;
    let selectedBouquet: Bouquet | undefined;

    if (selectedBiller.category === 'Cable TV') {
        selectedBouquet = bouquets[selectedBiller.id]?.find(b => b.id === selectedBouquetId);
        if (selectedBouquet) paymentAmount = selectedBouquet.price;
    } else {
        paymentAmount = parseFloat(amount);
    }

    return (
        <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Paying To</span>
                    <span className="font-semibold">{selectedBiller.name}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{selectedBiller.fieldLabel}</span>
                    <span className="font-semibold">{accountId}</span>
                </div>
                 {(verifiedInfo?.name || verifiedName) && (
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Account Name</span>
                        <span className="font-semibold">{verifiedInfo?.name || verifiedName}</span>
                    </div>
                )}
                 {selectedBouquet && (
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-semibold">{selectedBouquet.name}</span>
                    </div>
                )}
            </div>
             <div className="flex justify-between items-center font-bold text-2xl">
                <span>Total</span>
                <span>₦{paymentAmount.toLocaleString()}</span>
            </div>
        </div>
    );
  };

  const isProceedDisabled = () => {
    if (selectedBiller?.category === 'Cable TV') {
        return !verifiedName || !selectedBouquetId;
    }
    return !accountId || !amount || parseFloat(amount) <= 0;
  }

  return (
    <>
      <div className="space-y-5">
        <div className="relative max-w-2xl">
          <Input
            type="search"
            placeholder="Search biller (e.g., IKEDC, DStv, Spectranet)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl border-slate-200 bg-white shadow-inner"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-56 rounded-2xl border-slate-200 bg-white shadow-inner">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Pick a category, then choose your biller.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBillers
            .filter((b) => b.category === selectedCategory && b.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((biller) => {
              const Icon = biller.icon;
              return (
                <Card
                  key={biller.id}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-lg transition"
                  onClick={() => setSelectedBiller(biller)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-slate-100 p-2">
                        <Icon className="h-5 w-5 text-slate-800" />
                      </div>
                      <CardTitle className="text-base">{biller.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <UICardDescription>{biller.fieldLabel}</UICardDescription>
                  </CardContent>
                </Card>
              );
            })}
          {allBillers.filter((b) => b.category === selectedCategory && b.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="col-span-full text-center py-6 text-muted-foreground text-sm">
              No billers found for this category.
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedBiller} onOpenChange={(isOpen) => { if (!isOpen) resetDialogState() }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogView === 'form' ? `Pay ${selectedBiller?.name}` : 'Confirm Payment'}</DialogTitle>
            <UICardDescription>
              {dialogView === 'form' ? 'Enter the details below to complete your payment.' : 'Please review the details before confirming.'}
            </UICardDescription>
          </DialogHeader>
          {dialogView === 'form' ? renderDialogFormContent() : renderDialogSummaryContent()}
          <DialogFooter>
            {dialogView === 'form' ? (
              <>
                <Button variant="outline" onClick={resetDialogState}>Cancel</Button>
                <Button onClick={handleProceedToSummary} disabled={isProceedDisabled()}>
                  Proceed
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDialogView('form')}>Back</Button>
                <Button onClick={handlePayment}>
                  Confirm & Pay
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PinModal 
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmPayment}
        isProcessing={isSubmitting}
        error={apiError}
        onClearError={() => setApiError(null)}
      />
      {/* receipts are now shown on /success page using pending receipt saved to localStorage */}
    </>
  );
}
