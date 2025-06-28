"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Droplet, Wifi, Tv, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Biller {
  name: string;
  icon: LucideIcon;
  description: string;
}

const billers: Biller[] = [
  { name: 'Electricity', icon: Lightbulb, description: 'Pay your electricity bills (prepaid/postpaid).' },
  { name: 'Water', icon: Droplet, description: 'Settle your water utility bills.' },
  { name: 'Internet', icon: Wifi, description: 'Renew your internet subscriptions.' },
  { name: 'Cable TV', icon: Tv, description: 'Pay for your cable TV packages.' },
  { name: 'Airtime', icon: Smartphone, description: 'Top up your mobile phone airtime.' },
];

export function BillerList() {
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {billers.map((biller) => (
          <Card key={biller.name}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <biller.icon className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>{biller.name}</CardTitle>
                <CardDescription>{biller.description}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => setSelectedBiller(biller)}>Pay Now</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedBiller} onOpenChange={(isOpen) => !isOpen && setSelectedBiller(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay for {selectedBiller?.name}</DialogTitle>
            <DialogDescription>
              Enter the details below to complete your payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-id" className="text-right">
                Account/Meter No.
              </Label>
              <Input id="account-id" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (₦)
              </Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
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
