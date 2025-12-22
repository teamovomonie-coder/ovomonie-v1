
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Share2, Smartphone, Wifi, Wallet } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { PinModal } from '@/components/auth/pin-modal';
import { pendingTransactionService } from '@/lib/pending-transaction-service';

// UUID polyfill for environments without crypto.randomUUID
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- Mock Data & Logos ---

const MtnLogo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/mtn.jpg" alt="MTN" className="w-full h-full object-contain" />
  </div>
);
const AirtelLogo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/airtel.png" alt="Airtel" className="w-full h-full object-contain" />
  </div>
);
const GloLogo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/glo.png" alt="Glo" className="w-full h-full object-contain" />
  </div>
);
const T2Logo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/t2.png" alt="T2" className="w-full h-full object-contain" />
  </div>
);

const networks = [
  { id: 'mtn', name: 'MTN', Logo: MtnLogo },
  { id: 'airtel', name: 'Airtel', Logo: AirtelLogo },
  { id: 'glo', name: 'Glo', Logo: GloLogo },
  { id: '9mobile', name: 'T2', Logo: T2Logo },
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

// --- Form Schemas ---

const phoneRegex = new RegExp(/^0[789][01]\d{8}$/);

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


type ReceiptData = {
    type: 'Airtime' | 'Data';
    network: string;
    phoneNumber: string;
    amount: number;
    planName?: string;
}

// --- Sub-components ---

function AirtimePurchaseForm({ onPurchase }: { onPurchase: (data: ReceiptData) => void }) {
  const router = useRouter();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState<z.infer<typeof airtimeSchema> | null>(null);
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
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
        
        const clientReference = `airtime-${generateUUID()}`;
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: purchaseData.amount,
                category: 'airtime',
                narration: `Airtime purchase for ${purchaseData.phoneNumber}`,
                party: {
                    name: networks.find(n => n.id === purchaseData.network)?.name || 'Airtime',
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
        
        // Navigate to receipt page with transaction reference
        router.push(`/receipt/${encodeURIComponent(clientReference)}`);

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
                  {networks.map(net => (
                    <SelectItem key={net.id} value={net.id}>
                      <div className="flex items-center gap-2">
                          <net.Logo /> {net.name}
                      </div>
                    </SelectItem>
                  ))}
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

function DataPurchaseForm({ onPurchase }: { onPurchase: (data: ReceiptData) => void }) {
  const router = useRouter();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState<{values: z.infer<typeof dataSchema>, plan: typeof dataPlans.mtn[0]} | null>(null);
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
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
                category: 'airtime', // API treats data as airtime category
                narration: `Data purchase: ${purchaseData.plan.name} for ${purchaseData.values.phoneNumber}`,
                party: {
                    name: networks.find(n => n.id === purchaseData.values.network)?.name || 'Data',
                    billerId: purchaseData.values.phoneNumber,
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
        
        // Navigate to receipt page with transaction reference
        router.push(`/receipt/${encodeURIComponent(clientReference)}`);
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
              <SelectContent>{networks.map(net => <SelectItem key={net.id} value={net.id}><div className="flex items-center gap-2"><net.Logo /> {net.name}</div></SelectItem>)}</SelectContent>
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

function PurchaseReceipt({ data, open, onOpenChange }: { data: ReceiptData | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    
    if (!data) return null;

    const networkInfo = networks.find(n => n.id === data.network);
    const NetworkLogo = networkInfo?.Logo || Wallet;

    const handleShare = () => {
        toast({
            title: "Shared!",
            description: "Your memorable receipt has been shared.",
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm p-0">
                <DialogHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row justify-between items-center space-y-0">
                    <DialogTitle className="text-lg font-bold">Transaction Successful</DialogTitle>
                    <Wallet className="w-6 h-6" />
                </DialogHeader>
                <div className="p-6 bg-card text-card-foreground">
                    <div className="text-center space-y-2 mb-6">
                        <NetworkLogo className="mx-auto w-16 h-16" />
                        <p className="text-sm text-muted-foreground">{data.type} Purchase</p>
                        <p className="text-4xl font-bold">₦{data.amount.toLocaleString()}</p>
                    </div>
                     <div className="border-t border-b border-border py-4 space-y-3">
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Beneficiary</span>
                            <span className="font-semibold">{data.phoneNumber}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Network</span>
                            <span className="font-semibold">{networkInfo?.name}</span>
                         </div>
                         {data.planName && (
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Plan</span>
                                <span className="font-semibold">{data.planName}</span>
                            </div>
                         )}
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ref ID</span>
                            <span className="font-semibold">OVO-{Date.now()}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-semibold">{new Date().toLocaleString()}</span>
                         </div>
                     </div>
                </div>
                <DialogFooter className="flex-col gap-2 p-4 pt-0 sm:flex-col sm:space-x-0">
                    <p data-powered-by="ovomonie" className="text-xs text-muted-foreground text-center mb-2">Powered by Ovomonie</p>
                    <Button className="w-full" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" /> Share Receipt
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main Component ---

export function AirtimeForm() {
  
    return (
        <>
            <Tabs defaultValue="airtime" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="airtime"><Smartphone className="h-4 w-4 mr-2" />Buy Airtime</TabsTrigger>
                    <TabsTrigger value="data"><Wifi className="h-4 w-4 mr-2" />Buy Data</TabsTrigger>
                </TabsList>
                <TabsContent value="airtime" className="pt-6">
                    <AirtimePurchaseForm onPurchase={() => {}} />
                </TabsContent>
                <TabsContent value="data" className="pt-6">
                    <DataPurchaseForm onPurchase={() => {}} />
                </TabsContent>
            </Tabs>
        </>
    );
}
