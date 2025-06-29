"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Tv, Wifi, Droplet, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

interface Biller {
  name: string;
  icon: LucideIcon;
  category: 'Electricity' | 'Cable TV' | 'Internet' | 'Water';
  fieldLabel: string;
  placeholder: string;
}

const allBillers: Biller[] = [
  // Electricity
  { name: 'Ikeja Electric (IKEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your IKEDC number' },
  { name: 'Eko Electric (EKEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your EKEDC number' },
  { name: 'Abuja Electric (AEDC)', icon: Lightbulb, category: 'Electricity', fieldLabel: 'Meter/Account Number', placeholder: 'Enter your AEDC number' },
  // Cable TV
  { name: 'DSTV', icon: Tv, category: 'Cable TV', fieldLabel: 'Smartcard Number', placeholder: 'Enter your DSTV IUC/Smartcard' },
  { name: 'GOtv', icon: Tv, category: 'Cable TV', fieldLabel: 'IUC Number', placeholder: 'Enter your GOtv IUC number' },
  { name: 'StarTimes', icon: Tv, category: 'Cable TV', fieldLabel: 'Smartcard Number', placeholder: 'Enter your StarTimes Smartcard' },
  // Internet
  { name: 'Spectranet', icon: Wifi, category: 'Internet', fieldLabel: 'User ID', placeholder: 'Enter your Spectranet User ID' },
  { name: 'Smile', icon: Wifi, category: 'Internet', fieldLabel: 'Account ID', placeholder: 'Enter your Smile Account ID' },
  // Water
  { name: 'Lagos Water Corp', icon: Droplet, category: 'Water', fieldLabel: 'Customer ID', placeholder: 'Enter your LWC Customer ID' },
];

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
  const { toast } = useToast();

  const handlePayment = () => {
    if (!amount || !accountId) {
        toast({
            title: "Error",
            description: "Please fill in all fields.",
            variant: "destructive"
        });
        return;
    }
    toast({
        title: "Payment Successful!",
        description: `Your payment of ₦${amount} for ${selectedBiller?.name} has been processed.`,
    });
    setSelectedBiller(null);
    setAmount('');
    setAccountId('');
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

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search for a biller (e.g., DSTV, IKEDC)"
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
                            {filteredBillers.map((biller) => <BillerCard key={biller.name} biller={biller} />)}
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
                                <BillerCard key={biller.name} biller={biller} />
                            ))}
                        </div>
                    </TabsContent>
                 ))
            )}
        </Tabs>
      </div>

      <Dialog open={!!selectedBiller} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedBiller(null); setAccountId(''); setAmount(''); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pay {selectedBiller?.name}</DialogTitle>
            <DialogDescription>
              Enter the details below to complete your payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-id" className="text-right">
                {selectedBiller?.fieldLabel}
              </Label>
              <Input id="account-id" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="col-span-3" placeholder={selectedBiller?.placeholder} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (₦)
              </Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="Enter amount" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handlePayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
