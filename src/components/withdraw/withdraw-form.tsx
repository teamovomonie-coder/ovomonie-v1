
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Share2, Wallet, Loader2, ArrowLeft, Landmark, Info, Check, ChevronsUpDown, Hash, Code, Store, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nigerianBanks } from '@/lib/banks';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { Separator } from '../ui/separator';

const amountSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
});

const posAgentSchema = z.object({
  agentId: z.string().min(4, 'Agent ID must be at least 4 characters.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
});

const bankTransferSchema = z.object({
  bankCode: z.string().min(1, 'Please select a bank.'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  narration: z.string().max(50, "Narration can't exceed 50 characters.").optional(),
});

type BankTransferFormData = z.infer<typeof bankTransferSchema>;

const topBankCodes = ["058", "044", "057", "011", "033"];
const topBanks = nigerianBanks.filter(b => topBankCodes.includes(b.code));
const otherBanks = nigerianBanks.filter(b => !topBankCodes.includes(b.code));

function WithdrawalReceipt({ data, recipientName, bankName, onReset }: { data: {amount: number, narration?: string | null}, recipientName: string; bankName: string; onReset: () => void }) {
  const { toast } = useToast();
  const handleShare = () => toast({ title: "Shared!", description: "Your withdrawal receipt has been shared." });

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20">
      <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center"><h2 className="text-lg font-bold">Withdrawal Successful!</h2><Landmark className="w-6 h-6" /></div>
      <CardContent className="p-4 bg-card"><div className="border-2 border-primary-light-bg rounded-lg p-4 space-y-4">
          <div className="text-center space-y-1"><p className="text-sm text-muted-foreground">You withdrew</p><p className="text-4xl font-bold text-foreground">₦{data.amount.toLocaleString()}</p><p className="text-sm text-muted-foreground">to</p><p className="text-lg font-semibold text-foreground">{recipientName}</p><p className="text-sm text-muted-foreground">{bankName}</p></div>
          <div className="text-xs text-muted-foreground pt-4 space-y-2"><div className="flex justify-between"><span>Date</span><span>{new Date().toLocaleString()}</span></div><div className="flex justify-between"><span>Ref ID</span><span>OVO-WTH-{Date.now()}</span></div></div>
      </div></CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0"><p className="text-xs text-muted-foreground mb-2">Powered by Ovomonie</p><Button className="w-full" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Share Receipt</Button><Button variant="outline" className="w-full" onClick={onReset}>Make Another Withdrawal</Button></CardFooter>
    </Card>
  );
}

function BankTransferWithdrawal() {
  const [step, setStep] = useState<'form' | 'summary' | 'receipt'>('form');
  const [isVerifying, setIsVerifying] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<BankTransferFormData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [isBankPopoverOpen, setIsBankPopoverOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  const { toast } = useToast();
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<BankTransferFormData>({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: { bankCode: '', accountNumber: '', amount: 0, narration: '' },
  });

  const { watch, clearErrors, setError } = form;
  const watchedAccountNumber = watch('accountNumber');
  const watchedBankCode = watch('bankCode');

  const filteredTopBanks = topBanks.filter(bank => bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()));
  const filteredOtherBanks = otherBanks.filter(bank => !topBankCodes.includes(b.code));

  useEffect(() => {
    setRecipientName(null);
    if (watchedAccountNumber?.length !== 10) clearErrors('accountNumber');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (watchedAccountNumber?.length === 10 && watchedBankCode) {
        setIsVerifying(true);
        debounceRef.current = setTimeout(async () => {
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            const mockAccounts: {[key: string]: {[key: string]: string}} = {
                '058': { '0123456789': 'JANE DOE', '1234567890': 'MARY ANNE' },
                '044': { '0987654321': 'JOHN SMITH', '9876543210': 'ADAMU CIROMA' },
            };
            if (mockAccounts[watchedBankCode]?.[watchedAccountNumber]) {
                setRecipientName(mockAccounts[watchedBankCode][watchedAccountNumber]);
                clearErrors('accountNumber');
            } else {
                setError('accountNumber', { type: 'manual', message: 'Account not found. Please check the details and try again.' });
            }
            setIsVerifying(false);
        }, 500);
    } else {
        setIsVerifying(false);
    }
    
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }
  }, [watchedAccountNumber, watchedBankCode, clearErrors, setError]);

  const onSubmit = (data: BankTransferFormData) => {
    if (!recipientName) {
      setError('accountNumber', { type: 'manual', message: 'Please wait for account verification to complete.' });
      return;
    }
    if (balance === null || (data.amount * 100) > balance) {
        toast({ variant: "destructive", title: "Insufficient Funds" });
        return;
    }
    setSubmittedData(data);
    setStep('summary');
  };

  const handleFinalSubmit = async () => {
    if (!submittedData || !recipientName) return;
    
    setIsProcessing(true);
    setApiError(null);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const response = await fetch('/api/transfers/external', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...submittedData, recipientName, clientReference: `withdraw-${crypto.randomUUID()}` }),
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Withdrawal failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.data.newBalanceInKobo);
        addNotification({
            title: 'Withdrawal Successful',
            description: `You withdrew ₦${submittedData.amount.toLocaleString()} to ${recipientName}.`,
            category: 'transaction',
        });
        toast({ title: 'Withdrawal Successful!' });
        setIsPinModalOpen(false);
        setStep('receipt');
    } catch (error: any) {
        let description = 'An unknown error occurred.';
        if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
            description = error.message;
        }
        setApiError(description);
    } finally {
        setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setSubmittedData(null);
    setRecipientName(null);
    form.reset();
  };

  if (step === 'receipt' && submittedData && recipientName) {
    const bankName = nigerianBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
    return <WithdrawalReceipt data={submittedData} recipientName={recipientName} bankName={bankName} onReset={resetForm} />;
  }

  if (step === 'summary' && submittedData && recipientName) {
    const bankName = nigerianBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
    return (
      <>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Withdrawal Summary</CardTitle>
            <CardDescription>Please review the details before confirming.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Recipient</span><span className="font-semibold">{recipientName}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Bank</span><span className="font-semibold">{bankName}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Account Number</span><span className="font-semibold">{submittedData.accountNumber}</span></div>
            <Separator />
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Amount</span><span className="font-bold text-lg text-primary">₦{submittedData.amount.toLocaleString()}</span></div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={() => setStep('form')} disabled={isProcessing}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button className="w-full" onClick={() => setIsPinModalOpen(true)} disabled={isProcessing}>Confirm Withdrawal</Button>
          </CardFooter>
        </Card>
        <PinModal
          open={isPinModalOpen}
          onOpenChange={setIsPinModalOpen}
          onConfirm={handleFinalSubmit}
          isProcessing={isProcessing}
          error={apiError}
          onClearError={() => setApiError(null)}
          title="Confirm Withdrawal"
        />
      </>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert><Info className="h-4 w-4" /><AlertTitle>For Testing</AlertTitle><AlertDescription><p className="mb-2">Use one of these bank/account pairs for successful verification:</p><ul className="list-disc pl-5 space-y-1 text-xs"><li><b>GTB (058):</b> 0123456789</li><li><b>Access Bank (044):</b> 0987654321</li></ul></AlertDescription></Alert>
        <FormField control={form.control} name="bankCode" render={({ field }) => (
            <FormItem><FormLabel>Bank</FormLabel>
                <Popover open={isBankPopoverOpen} onOpenChange={setIsBankPopoverOpen}>
                  <PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{field.value ? nigerianBanks.find(bank => bank.code === field.value)?.name : "Select a bank"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search for a bank..." value={bankSearchQuery} onValueChange={setBankSearchQuery} /><CommandList><CommandEmpty>No bank found.</CommandEmpty>
                        <CommandGroup heading="Top Banks">{filteredTopBanks.map(bank => (<CommandItem key={bank.code} value={bank.name} onSelect={() => { form.setValue("bankCode", bank.code); setIsBankPopoverOpen(false); setBankSearchQuery(""); }}><Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />{bank.name}</CommandItem>))}</CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="All Banks">{filteredOtherBanks.map(bank => (<CommandItem key={bank.code} value={bank.name} onSelect={() => { form.setValue("bankCode", bank.code); setIsBankPopoverOpen(false); setBankSearchQuery(""); }}><Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />{bank.name}</CommandItem>))}</CommandGroup>
                  </CommandList></Command></PopoverContent>
                </Popover><FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="accountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><div className="relative"><FormControl><Input placeholder="10-digit account number" {...field} /></FormControl>{isVerifying && (<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />)}</div>{recipientName && !isVerifying && (<div className="text-green-600 bg-green-500/10 p-2 rounded-md text-sm font-semibold mt-1 flex items-center gap-2"><Check className="h-4 w-4" />{recipientName}</div>)}<FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="narration" render={({ field }) => (<FormItem><FormLabel>Narration (Optional)</FormLabel><FormControl><Input placeholder="e.g., For groceries" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <Button type="submit" className="w-full !mt-6" disabled={isVerifying || !recipientName}>Continue</Button>
      </form>
    </Form>
  );
}

function AtmCardlessWithdrawal() {
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);

    const form = useForm<z.infer<typeof amountSchema>>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });

    useEffect(() => {
        if (!generatedCode) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGeneratedCode(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [generatedCode]);

    const onSubmit = (data: z.infer<typeof amountSchema>) => {
        setPendingAmount(data.amount);
        setIsPinModalOpen(true);
    };

    const handleGenerateCode = async () => {
        if (pendingAmount && pendingAmount > 0) {
            setIsProcessing(true);
            await new Promise(res => setTimeout(res, 1000));
            setGeneratedCode(Array(3).fill(0).map(() => Math.floor(Math.random() * 900 + 100).toString()).join('-'));
            setTimeLeft(300);
            setIsProcessing(false);
            setIsPinModalOpen(false);
            form.reset();
        }
    };

    if (generatedCode) {
        return (
            <div className="text-center space-y-4">
                <p>Use the code below at a supported ATM:</p>
                <div className="bg-muted p-4 rounded-lg"><p className="text-3xl font-bold tracking-widest">{generatedCode}</p></div>
                <p className="font-semibold text-destructive">Expires in: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}</p>
                <Button onClick={() => { setGeneratedCode(null); form.reset(); }}>Done</Button>
            </div>
        );
    }

    return (
        <><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" className="w-full">Generate Code</Button></form></Form><PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handleGenerateCode} isProcessing={isProcessing} /></>
    );
}

function PosAgentWithdrawal() {
    const { toast } = useToast();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingData, setPendingData] = useState<z.infer<typeof posAgentSchema> | null>(null);

    const form = useForm<z.infer<typeof posAgentSchema>>({ resolver: zodResolver(posAgentSchema), defaultValues: { agentId: '', amount: 0 } });

    function onSubmit(data: z.infer<typeof posAgentSchema>) {
        setPendingData(data);
        setIsPinModalOpen(true);
    }

    async function handleFinalSubmit() {
        if (!pendingData) return;
        setIsProcessing(true);
        await new Promise(res => setTimeout(res, 1500));
        setIsProcessing(false);
        setIsPinModalOpen(false);
        toast({ title: "Withdrawal Requested", description: `Withdrawal of ₦${pendingData.amount.toLocaleString()} from agent ${pendingData.agentId} has been requested.` });
        form.reset();
        setPendingData(null);
    }
    
    return (
         <><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="agentId" render={({ field }) => (<FormItem><FormLabel>Agent ID</FormLabel><FormControl><Input placeholder="Enter agent ID" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" className="w-full">Request Withdrawal</Button></form></Form><PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handleFinalSubmit} isProcessing={isProcessing} /></>
    )
}

function UssdWithdrawal() {
    const [ussdString, setUssdString] = useState<string | null>(null);
    const { toast } = useToast();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);

    const form = useForm<z.infer<typeof amountSchema>>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });

    const onSubmit = (data: z.infer<typeof amountSchema>) => {
        setPendingAmount(data.amount);
        setIsPinModalOpen(true);
    }

    const handleGenerateCode = async () => {
        if (pendingAmount && pendingAmount > 0) {
            setIsProcessing(true);
            await new Promise(res => setTimeout(res, 1000));
            setUssdString(`*894*${pendingAmount}*12345#`);
            setIsProcessing(false);
            setIsPinModalOpen(false);
        }
    }

    if (ussdString) {
        return (
            <div className="text-center space-y-4">
                <p>Dial the code below on your mobile phone:</p>
                <div className="bg-muted p-4 rounded-lg"><p className="text-2xl font-bold tracking-widest">{ussdString}</p></div>
                <div className="flex gap-2"><Button onClick={() => { setUssdString(null); form.reset(); }} variant="outline" className="w-full">Back</Button><Button onClick={() => { navigator.clipboard.writeText(ussdString); toast({title: "Copied!", description: "USSD code copied."}) }} className="w-full">Copy Code</Button></div>
            </div>
        );
    }
    
    return (
        <><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 2000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" className="w-full">Generate USSD Code</Button></form></Form><PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handleGenerateCode} isProcessing={isProcessing} /></>
    );
}

function QrCodeWithdrawal() {
     const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
     const [isPinModalOpen, setIsPinModalOpen] = useState(false);
     const [isProcessing, setIsProcessing] = useState(false);
     const [pendingAmount, setPendingAmount] = useState<number>(0);
    
     const form = useForm<z.infer<typeof amountSchema>>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });

     const onSubmit = (data: z.infer<typeof amountSchema>) => {
        setPendingAmount(data.amount);
        setIsPinModalOpen(true);
     }

     const handleGenerateCode = async () => {
        if(pendingAmount > 0) {
            setIsProcessing(true);
            await new Promise(res => setTimeout(res, 1000));
            setQrCodeUrl(`https://placehold.co/256x256.png`);
            setIsProcessing(false);
            setIsPinModalOpen(false);
        }
     }

     if(qrCodeUrl) {
         return (
            <div className="text-center space-y-4">
                <p>Have the agent or ATM scan this QR code.</p>
                <div className="bg-white p-4 inline-block rounded-lg"><Image src={qrCodeUrl} alt="Withdrawal QR Code" width={256} height={256} data-ai-hint="qr code" /></div>
                <p className="font-bold text-xl">Amount: ₦{pendingAmount.toLocaleString()}</p>
                <Button onClick={() => { setQrCodeUrl(null); form.reset(); }} className="w-full">Done</Button>
            </div>
         );
     }

    return (
        <><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 15000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" className="w-full">Generate QR Code</Button></form></Form><PinModal open={isPinModalOpen} onOpenChange={setIsPinModalOpen} onConfirm={handleGenerateCode} isProcessing={isProcessing} /></>
    );
}


export function WithdrawForm() {
    return (
        <Tabs defaultValue="bank" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="bank" className="flex-col sm:flex-row h-16 sm:h-10"><Landmark className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" /><span className="hidden sm:inline">Bank</span></TabsTrigger>
                <TabsTrigger value="atm" className="flex-col sm:flex-row h-16 sm:h-10"><Code className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" /><span className="hidden sm:inline">ATM</span></TabsTrigger>
                <TabsTrigger value="pos" className="flex-col sm:flex-row h-16 sm:h-10"><Store className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" /><span className="hidden sm:inline">Agent</span></TabsTrigger>
                <TabsTrigger value="ussd" className="flex-col sm:flex-row h-16 sm:h-10"><Hash className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" /><span className="hidden sm:inline">USSD</span></TabsTrigger>
                <TabsTrigger value="qr" className="flex-col sm:flex-row h-16 sm:h-10"><QrCode className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" /><span className="hidden sm:inline">QR</span></TabsTrigger>
            </TabsList>
            <TabsContent value="bank" className="pt-4">
                <BankTransferWithdrawal />
            </TabsContent>
            <TabsContent value="atm" className="pt-4">
                 <CardHeader className="p-0 mb-4 -mt-4"><CardTitle>ATM Cardless Withdrawal</CardTitle><CardDescription>Generate a temporary code to withdraw cash from a supported ATM without your card.</CardDescription></CardHeader>
                <AtmCardlessWithdrawal />
            </TabsContent>
             <TabsContent value="pos" className="pt-4">
                <CardHeader className="p-0 mb-4 -mt-4"><CardTitle>POS Agent Withdrawal</CardTitle><CardDescription>Withdraw cash from a verified Ovomonie agent near you.</CardDescription></CardHeader>
                <PosAgentWithdrawal />
            </TabsContent>
            <TabsContent value="ussd" className="pt-4">
                <CardHeader className="p-0 mb-4 -mt-4"><CardTitle>USSD Withdrawal</CardTitle><CardDescription>Generate a USSD code to complete your withdrawal on any mobile phone.</CardDescription></CardHeader>
                <UssdWithdrawal />
            </TabsContent>
            <TabsContent value="qr" className="pt-4">
                <CardHeader className="p-0 mb-4 -mt-4"><CardTitle>QR Code Withdrawal</CardTitle><CardDescription>Generate a secure QR code for agents or ATMs to scan.</CardDescription></CardHeader>
                <QrCodeWithdrawal />
            </TabsContent>
        </Tabs>
    );
}
