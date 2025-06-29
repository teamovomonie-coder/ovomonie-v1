
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Tv, Wifi, Droplet, Search, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const allBillers: Biller[] = [
  // Electricity
  { id: 'ikedc', name: 'Ikeja Electric (IKEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your IKEDC number' },
  { id: 'ekedc', name: 'Eko Electric (EKEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your EKEDC number' },
  { id: 'aedc', name: 'Abuja Electric (AEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your AEDC number' },
  // Cable TV
  { id: 'dstv', name: 'DStv', icon: Tv, category: 'Cable TV', fieldLabel: 'Smartcard Number', placeholder: 'Enter your DStv IUC/Smartcard' },
  { id: 'gotv', name: 'GOtv', icon: Tv, category: 'Cable TV', fieldLabel: 'IUC Number', placeholder: 'Enter your GOtv IUC number' },
  { id: 'startimes', name: 'StarTimes', icon: Tv, category: 'Cable TV', fieldLabel: 'Smartcard Number', placeholder: 'Enter your StarTimes Smartcard' },
  // Internet
  { id: 'spectranet', name: 'Spectranet', icon: Wifi, category: 'Internet', fieldLabel: 'User ID', placeholder: 'Enter your Spectranet User ID' },
  { id: 'smile', name: 'Smile', icon: Wifi, category: 'Internet', fieldLabel: 'Account ID', placeholder: 'Enter your Smile Account ID' },
  // Water
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
    ]
};

const mockSmartcards: Record<string, Record<string, string>> = {
    dstv: { '1234567890': 'JOHN DOE', '0987654321': 'JANE SMITH' },
    gotv: { '1122334455': 'FEMI ADEBOLA', '5544332211': 'CHIOMA OKOYE' },
    startimes: { '5566778899': 'MUSA ALIYU', '9988776655': 'AMINA YAKUBU' },
}

const categories = [
    { name: 'Electricity', icon: Lightbulb },
    { name: 'Cable TV', icon: Tv },
    { name: 'Internet', icon: Wifi },
    { name: 'Water', icon: Droplet },
] as const;

export function BillerList() {
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [selectedBouquetId, setSelectedBouquetId] = useState<string>('');
  const { toast } = useToast();

  const resetDialogState = () => {
    setSelectedBiller(null);
    setAmount('');
    setAccountId('');
    setIsVerifying(false);
    setIsSubmitting(false);
    setVerifiedName(null);
    setSelectedBouquetId('');
  }
  
  const handleVerifySmartcard = async () => {
    if (!selectedBiller || !accountId) return;
    setIsVerifying(true);
    setVerifiedName(null);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    const providerSmartcards = mockSmartcards[selectedBiller.id];
    if (providerSmartcards && providerSmartcards[accountId]) {
        setVerifiedName(providerSmartcards[accountId]);
    } else {
        toast({
            title: "Verification Failed",
            description: "Invalid Smartcard number. Please check and try again.",
            variant: "destructive"
        });
    }
    setIsVerifying(false);
  };

  const handlePayment = () => {
    setIsSubmitting(true);
    let description = '';

    if (selectedBiller?.category === 'Cable TV') {
        const bouquet = bouquets[selectedBiller.id]?.find(b => b.id === selectedBouquetId);
        if (!bouquet) {
            toast({ title: "Error", description: "Please select a bouquet.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        description = `Your payment of ₦${bouquet.price} for ${selectedBiller.name} (${bouquet.name}) was successful.`;
    } else {
         if (!amount || !accountId) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        description = `Your payment of ₦${amount} for ${selectedBiller?.name} has been processed.`;
    }

    setTimeout(() => {
        toast({
            title: "Payment Successful!",
            description: description,
        });
        resetDialogState();
    }, 1500);
  };
  
  const filteredBillers = allBillers.filter(biller => 
    biller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BillerCard = ({ biller }: { biller: Biller }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="p-2 bg-muted rounded-md">
            <biller.icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base">{biller.name}</CardTitle>
        </div>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" onClick={() => setSelectedBiller(biller)}>Pay Now</Button>
      </CardFooter>
    </Card>
  );

  const renderDialogContent = () => {
    if (!selectedBiller) return null;

    if (selectedBiller.category === 'Cable TV') {
        const providerBouquets = bouquets[selectedBiller.id] || [];
        const selectedBouquet = providerBouquets.find(b => b.id === selectedBouquetId);
        
        return (
            <div className="grid gap-4 py-4">
                <Alert>
                    <Tv className="h-4 w-4" />
                    <AlertTitle>Testing Info</AlertTitle>
                    <AlertDescription>
                        Use smartcard numbers like 1234567890 (DStv), 1122334455 (GOtv), or 5566778899 (StarTimes) for successful verification.
                    </AlertDescription>
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

                {verifiedName && (
                    <>
                        <div className="bg-green-50 p-3 rounded-md text-center">
                            <p className="text-sm text-green-700">Customer Name</p>
                            <p className="font-bold text-green-800 text-lg">{verifiedName}</p>
                        </div>
                        <div className="space-y-2">
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
                    </>
                )}
            </div>
        );
    }

    // Default for other categories
    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-id" className="text-right">{selectedBiller.fieldLabel}</Label>
              <Input id="account-id" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="col-span-3" placeholder={selectedBiller.placeholder} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount (₦)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="Enter amount" />
            </div>
        </div>
    );
  };

  const isPaymentDisabled = () => {
    if (isSubmitting) return true;
    if (selectedBiller?.category === 'Cable TV') {
        return !verifiedName || !selectedBouquetId;
    }
    return !accountId || !amount;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search for a biller (e.g., DStv, IKEDC)"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue={searchQuery ? 'search' : 'Electricity'} className="w-full">
            <TabsList className={cn("grid w-full", searchQuery ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4")}>
                {searchQuery ? (
                    <TabsTrigger value="search">Search Results</TabsTrigger>
                ) : (
                    categories.map(cat => (
                         <TabsTrigger key={cat.name} value={cat.name} className="gap-2">
                            <cat.icon className="h-5 w-5"/> <span className="hidden sm:inline">{cat.name}</span>
                        </TabsTrigger>
                    ))
                )}
            </TabsList>
            
            {searchQuery ? (
                 <TabsContent value="search" className="pt-4">
                     {filteredBillers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredBillers.map((biller) => <BillerCard key={biller.id} biller={biller} />)}
                        </div>
                     ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No billers found for "{searchQuery}"</p>
                        </div>
                     )}
                 </TabsContent>
            ) : (
                 categories.map(cat => (
                    <TabsContent key={cat.name} value={cat.name} className="pt-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allBillers.filter(b => b.category === cat.name).map((biller) => (
                                <BillerCard key={biller.id} biller={biller} />
                            ))}
                        </div>
                    </TabsContent>
                 ))
            )}
        </Tabs>
      </div>

      <Dialog open={!!selectedBiller} onOpenChange={(isOpen) => { if (!isOpen) resetDialogState() }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pay {selectedBiller?.name}</DialogTitle>
            <DialogDescription>
              Enter the details below to complete your payment.
            </DialogDescription>
          </DialogHeader>
          {renderDialogContent()}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handlePayment} disabled={isPaymentDisabled()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

