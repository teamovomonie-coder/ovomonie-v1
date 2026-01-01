
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
import { generateUUID, generateTransactionReference } from '@/lib/uuid';
import { PinModal } from '@/components/auth/pin-modal';
import networks from '@/components/airtime/network-logos';

const networksList = [
  { id: 'mtn', name: 'MTN', Logo: networks.mtn.Logo },
  { id: 'airtel', name: 'Airtel', Logo: networks.airtel.Logo },
  { id: 'glo', name: 'Glo', Logo: networks.glo.Logo },
  { id: '9mobile', name: '9mobile', Logo: networks['9mobile'].Logo },
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
        
        const clientReference = generateTransactionReference('airtime');
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: purchaseData.amount,
                category: 'airtime',
                narration: `Airtime purchase for ${purchaseData.phoneNumber}`,
                party: {
                    name: networksList.find(n => n.id === purchaseData.network)?.name || 'Airtime',
                    billerId: purchaseData.phoneNumber
                }
            })
        });

        const result = await response.json();
        console.log('[AirtimeForm] Payment response:', result);
        
        if (!response.ok) {
            const error: any = new Error(result.message || 'Airtime purchase failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        
        setIsPinModalOpen(false);
        form.reset();
        setPurchaseData(null);
        
<<<<<<< HEAD
        // Navigate to unified receipt page with transaction ID
        const transactionId = result.transaction_id || clientReference;
        const receiptReference = result.reference || clientReference;
        router.push(`/receipt/${encodeURIComponent(receiptReference)}?txId=${encodeURIComponent(transactionId)}&type=airtime&ref=${encodeURIComponent(receiptReference)}`);
=======
        // Get the transaction reference from response (use VFD reference if available)
        const txReference = result.data?.reference || result.reference || clientReference;
        
        console.log('[AirtimeForm] Payment successful, redirecting to success with reference:', txReference);
        
        // Redirect directly to success page with reference and additional params for fallback
        const successUrl = `/success?ref=${encodeURIComponent(txReference)}&type=airtime&amount=${purchaseData.amount}&network=${encodeURIComponent(networks.find(n => n.id === purchaseData.network)?.name || 'MTN')}&phone=${encodeURIComponent(purchaseData.phoneNumber)}`;
        console.log('[AirtimeForm] Redirecting to:', successUrl);
        window.location.href = successUrl;
        
        // Also show success notification
        addNotification({
            title: 'Airtime Purchase Successful',
            description: `₦${purchaseData.amount.toLocaleString()} airtime sent to ${purchaseData.phoneNumber}`,
            category: 'transaction',
        });
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c

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
          <div className="grid gap-6">
            <FormField control={form.control} name="network" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Select Network
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 px-4 text-base border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all bg-white">
                      <SelectValue placeholder="Choose your network provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg">
                    {networksList.map(net => (
                      <SelectItem key={net.id} value={net.id} className="py-3 px-4 hover:bg-slate-50 rounded-lg mx-1">
                        <div className="flex items-center gap-3">
                          <net.Logo className="h-5 w-5" />
                          <span className="font-medium">{net.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}/>
            
            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="08012345678" 
                    {...field} 
                    className="h-12 px-4 text-base border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all bg-white"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}/>
            
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Amount
                </FormLabel>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₦</div>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field} 
                      value={field.value === 0 ? '' : field.value} 
                      onChange={e => field.onChange(e.target.valueAsNumber || 0)} 
                      className="h-12 pl-8 pr-4 text-base border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all bg-white"
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}/>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <span>Buy Airtime</span>
              </div>
            )}
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

        const clientReference = generateTransactionReference('data');
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: purchaseData.plan.price,
                category: 'data',
                narration: `Data purchase: ${purchaseData.plan.name} for ${purchaseData.values.phoneNumber}`,
                party: {
                    name: networksList.find(n => n.id === purchaseData.values.network)?.name || 'Data',
                    billerId: purchaseData.values.phoneNumber,
                    planName: purchaseData.plan.name
                }
            })
        });

        const result = await response.json();
        console.log('[DataForm] Payment response:', result);
        
        if (!response.ok) {
            const error: any = new Error(result.message || 'Data purchase failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        
        setIsPinModalOpen(false);
        form.reset();
        setPurchaseData(null);
        
<<<<<<< HEAD
        // Navigate to unified receipt page with transaction ID
        const transactionId = result.transaction_id || clientReference;
        const receiptReference = result.reference || clientReference;
        router.push(`/receipt/${encodeURIComponent(receiptReference)}?txId=${encodeURIComponent(transactionId)}&type=data&ref=${encodeURIComponent(receiptReference)}`);
=======
        // Get the transaction reference from response (use VFD reference if available)
        const txReference = result.data?.reference || result.reference || clientReference;
        
        console.log('[DataForm] Payment successful, redirecting to success with reference:', txReference);
        
        // Redirect directly to success page with reference and additional params for fallback
        const successUrl = `/success?ref=${encodeURIComponent(txReference)}&type=data&amount=${purchaseData.plan.price}&network=${encodeURIComponent(networks.find(n => n.id === purchaseData.values.network)?.name || 'MTN')}&phone=${encodeURIComponent(purchaseData.values.phoneNumber)}&plan=${encodeURIComponent(purchaseData.plan.name)}`;
        console.log('[DataForm] Redirecting to:', successUrl);
        window.location.href = successUrl;
        
        // Also show success notification
        addNotification({
            title: 'Data Purchase Successful',
            description: `${purchaseData.plan.name} sent to ${purchaseData.values.phoneNumber}`,
            category: 'transaction',
        });
>>>>>>> bdfa5df0c5205cc449861319ccf64befb7271c2c
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
        <div className="grid gap-6">
          <FormField control={form.control} name="network" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Select Network
              </FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); form.setValue('planId', ''); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 px-4 text-base border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all bg-white">
                    <SelectValue placeholder="Choose your network provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg">
                  {networksList.map(net => (
                    <SelectItem key={net.id} value={net.id} className="py-3 px-4 hover:bg-slate-50 rounded-lg mx-1">
                      <div className="flex items-center gap-3">
                        <net.Logo className="h-5 w-5" />
                        <span className="font-medium">{net.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}/>
          
          <FormField control={form.control} name="phoneNumber" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Phone Number
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="08012345678" 
                  {...field} 
                  className="h-12 px-4 text-base border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all bg-white"
                />
              </FormControl>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}/>
          
          <FormField control={form.control} name="planId" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Data Plan
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedNetwork}>
                <FormControl>
                  <SelectTrigger className="h-12 px-4 text-base border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400">
                    <SelectValue placeholder={selectedNetwork ? "Select a data plan" : "Select network first"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg">
                  {availablePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id} className="py-3 px-4 hover:bg-slate-50 rounded-lg mx-1">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-purple-600 font-bold">₦{plan.price.toLocaleString()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}/>
        </div>
        
        {selectedPlan && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-purple-600">₦{selectedPlan.price.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50" 
          disabled={!selectedPlan || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              <span>Buy Data</span>
            </div>
          )}
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

    const networkInfo = networksList.find(n => n.id === data.network);
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
            <Tabs defaultValue="airtime" className="w-full max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <Smartphone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Mobile Services</h2>
                            <p className="text-sm text-slate-600">Purchase airtime and data bundles instantly</p>
                        </div>
                    </div>
                    
                    <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl p-1 shadow-sm">
                        <TabsTrigger 
                            value="airtime" 
                            className="flex items-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                        >
                            <Smartphone className="h-4 w-4" />
                            Airtime
                        </TabsTrigger>
                        <TabsTrigger 
                            value="data" 
                            className="flex items-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                        >
                            <Wifi className="h-4 w-4" />
                            Data
                        </TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="airtime" className="mt-0">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <AirtimePurchaseForm onPurchase={() => {}} />
                    </div>
                </TabsContent>
                <TabsContent value="data" className="mt-0">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <DataPurchaseForm onPurchase={() => {}} />
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
