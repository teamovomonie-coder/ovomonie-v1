"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Wifi } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PinModal } from '@/components/auth/pin-modal';
import networks from './network-logos';

const networkList = [
  { id: 'mtn', name: 'MTN' },
  { id: 'airtel', name: 'Airtel' },
  { id: 'glo', name: 'Glo' },
  { id: '9mobile', name: '9mobile' },
];

const dataPlans: Record<string, { id: string, name: string, price: number }[]> = {
  mtn: [
    { id: 'mtn-1', name: '1.5GB - 30 Days', price: 1000 },
    { id: 'mtn-2', name: '4.5GB - 30 Days', price: 2000 },
    { id: 'mtn-3', name: '10GB - 30 Days', price: 3500 },
  ],
  airtel: [
    { id: 'airtel-1', name: '1GB - 30 Days', price: 1000 },
    { id: 'airtel-2', name: '3GB - 30 Days', price: 1500 },
    { id: 'airtel-3', name: '6GB - 30 Days', price: 2500 },
  ],
  glo: [
    { id: 'glo-1', name: '2.9GB - 30 Days', price: 1000 },
    { id: 'glo-2', name: '7.7GB - 30 Days', price: 2000 },
    { id: 'glo-3', name: '13.5GB - 30 Days', price: 3000 },
  ],
  '9mobile': [
    { id: 't2-1', name: '1GB - 30 Days', price: 1000 },
    { id: 't2-2', name: '4.5GB - 30 Days', price: 2000 },
    { id: 't2-3', name: '11GB - 30 Days', price: 4000 },
  ],
};

const phoneRegex = /^0[789][01]\d{8}$/;

const airtimeSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, 'Must be a valid Nigerian phone number.'),
  network: z.string().min(1, 'Please select a network.'),
  amount: z.coerce.number().min(50, 'Minimum amount is ₦50.').max(50000, 'Maximum amount is ₦50,000.'),
});

const dataSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, 'Must be a valid Nigerian phone number.'),
  network: z.string().min(1, 'Please select a network.'),
  planId: z.string().min(1, 'Please select a data plan.'),
});

function AirtimePurchaseForm() {
  const router = useRouter();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState<z.infer<typeof airtimeSchema> | null>(null);
  const { balance, updateBalance, logout } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof airtimeSchema>>({
    resolver: zodResolver(airtimeSchema),
    defaultValues: { phoneNumber: '', network: '', amount: 0 }
  });
  
  const onSubmit = (values: z.infer<typeof airtimeSchema>) => {
    if (balance === null || (values.amount * 100) > balance) {
      toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this purchase.' });
      return;
    }
    setPurchaseData(values);
    setIsPinModalOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseData || balance === null) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');
        
        const clientReference = `airtime-${crypto.randomUUID()}`;
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: purchaseData.amount,
                category: 'airtime',
                narration: `Airtime purchase for ${purchaseData.phoneNumber}`,
                party: {
                    name: networkList.find(n => n.id === purchaseData.network)?.name || 'Airtime',
                    billerId: purchaseData.phoneNumber
                }
            })
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Airtime purchase failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        
        setIsPinModalOpen(false);
        form.reset();
        setPurchaseData(null);
        
        const transactionId = result.transaction_id || clientReference;
        router.push(`/receipt/${encodeURIComponent(transactionId)}`);

    } catch(error: any) {
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
        setIsPinModalOpen(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="network" render={({ field }) => (
            <FormItem><FormLabel>Network</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a network" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {networkList.map(net => {
                    const NetworkLogo = networks[net.id]?.Logo;
                    return (
                      <SelectItem key={net.id} value={net.id}>
                        <div className="flex items-center gap-2">
                          {NetworkLogo && <NetworkLogo />} {net.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select><FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="phoneNumber" render={({ field }) => (
            <FormItem><FormLabel>Phone Number</FormLabel>
              <FormControl><Input placeholder="08012345678" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem><FormLabel>Amount (₦)</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 500" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Buy Airtime
          </Button>
        </form>
      </Form>
      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmPurchase}
        isProcessing={isSubmitting}
        error={apiError}
        onClearError={() => setApiError(null)}
      />
    </>
  );
}

function DataPurchaseForm() {
  const router = useRouter();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState<{values: z.infer<typeof dataSchema>, plan: typeof dataPlans.mtn[0]} | null>(null);
  const { balance, updateBalance, logout } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof dataSchema>>({
    resolver: zodResolver(dataSchema),
    defaultValues: { phoneNumber: '', network: '', planId: '' }
  });

  const selectedNetwork = form.watch('network');
  const availablePlans = selectedNetwork ? dataPlans[selectedNetwork] : [];
  const selectedPlanId = form.watch('planId');
  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId);

  const onSubmit = (values: z.infer<typeof dataSchema>) => {
    if (!selectedPlan) return;
    if (balance === null || selectedPlan.price * 100 > balance) {
       toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this purchase.' });
      return;
    }
    setPurchaseData({ values, plan: selectedPlan });
    setIsPinModalOpen(true);
  }

  const handleConfirmPurchase = async () => {
    if (!purchaseData || balance === null) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const clientReference = `data-${crypto.randomUUID()}`;
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: purchaseData.plan.price,
                category: 'airtime',
                narration: `Data purchase: ${purchaseData.plan.name} for ${purchaseData.values.phoneNumber}`,
                party: {
                    name: networkList.find(n => n.id === purchaseData.values.network)?.name || 'Data',
                    billerId: purchaseData.values.phoneNumber,
                    planName: purchaseData.plan.name
                }
            })
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Data purchase failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        
        setIsPinModalOpen(false);
        form.reset();
        setPurchaseData(null);
        
        const transactionId = result.transaction_id || clientReference;
        router.push(`/receipt/${encodeURIComponent(transactionId)}`);
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
        setIsPinModalOpen(false);
    }
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="network" render={({ field }) => (
          <FormItem><FormLabel>Network</FormLabel>
            <Select onValueChange={(value) => { field.onChange(value); form.setValue('planId', ''); }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a network" /></SelectTrigger></FormControl>
              <SelectContent>
                {networkList.map(net => {
                  const NetworkLogo = networks[net.id]?.Logo;
                  return (
                    <SelectItem key={net.id} value={net.id}>
                      <div className="flex items-center gap-2">
                        {NetworkLogo && <NetworkLogo />} {net.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select><FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="08012345678" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="planId" render={({ field }) => (
          <FormItem><FormLabel>Data Plan</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedNetwork}>
              <FormControl><SelectTrigger><SelectValue placeholder={selectedNetwork ? "Select a data plan" : "Select network first"} /></SelectTrigger></FormControl>
              <SelectContent>{availablePlans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name} - ₦{plan.price.toLocaleString()}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )}/>
        {selectedPlan && (
            <div className="text-right font-bold text-lg">
                Total: ₦{selectedPlan.price.toLocaleString()}
            </div>
        )}
        <Button type="submit" className="w-full" disabled={!selectedPlan || isSubmitting}>
          Buy Data
        </Button>
      </form>
    </Form>
    <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmPurchase}
        isProcessing={isSubmitting}
        error={apiError}
        onClearError={() => setApiError(null)}
    />
    </>
  );
}

export function AirtimeForm() {
    return (
        <Tabs defaultValue="airtime" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="airtime"><Smartphone className="h-4 w-4 mr-2" />Buy Airtime</TabsTrigger>
                <TabsTrigger value="data"><Wifi className="h-4 w-4 mr-2" />Buy Data</TabsTrigger>
            </TabsList>
            <TabsContent value="airtime" className="pt-6">
                <AirtimePurchaseForm />
            </TabsContent>
            <TabsContent value="data" className="pt-6">
                <DataPurchaseForm />
            </TabsContent>
        </Tabs>
    );
}