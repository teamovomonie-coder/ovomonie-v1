
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, Share2, Wallet, Loader2, ArrowLeft, Landmark, Info, Check, ChevronsUpDown, Hash, Code, Store, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nigerianBanks } from '@/lib/banks';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  bankCode: z.string().optional(),
  accountNumber: z.string().length(10, 'Account number must be 10 digits.').optional(),
  amount: z.coerce.number().positive('Amount must be positive.'),
  narration: z.string().max(50, "Narration can't exceed 50 characters.").optional(),
  message: z.string().max(150, 'Message is too long.').optional(),
  photo: z.any().optional(),
  agentId: z.string().min(4, 'Agent ID must be at least 4 characters.').optional(),
});

type FormData = z.infer<typeof formSchema>;

const topBankCodes = ["058", "044", "057", "011", "033"];
const topBanks = nigerianBanks.filter(b => topBankCodes.includes(b.code));
const otherBanks = nigerianBanks.filter(b => !topBankCodes.includes(b.code));

const amountSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
});

const posAgentSchema = z.object({
  agentId: z.string().min(4, 'Agent ID must be at least 4 characters.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
});


function BankTransferWithdrawal() {
  const [step, setStep] = useState<'form' | 'summary' | 'receipt'>('form');
  const [isMemoTransfer, setIsMemoTransfer] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [isBankPopoverOpen, setIsBankPopoverOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema.pick({
      bankCode: true,
      accountNumber: true,
      amount: true,
      narration: true,
      message: true,
      photo: true,
    })),
    defaultValues: { bankCode: '', accountNumber: '', amount: 0, narration: '', message: '' },
  });

  const { watch, clearErrors, setError, setValue } = form;
  const watchedAccountNumber = watch('accountNumber');
  const watchedBankCode = watch('bankCode');

  const filteredTopBanks = topBanks.filter(bank => bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()));
  const filteredOtherBanks = otherBanks.filter(bank => bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()));

  useEffect(() => {
    setRecipientName(null);
    if (watchedAccountNumber?.length !== 10) {
      clearErrors('accountNumber');
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (watchedAccountNumber?.length === 10 && watchedBankCode) {
        setIsVerifying(true);
        debounceRef.current = setTimeout(async () => {
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            const mockAccounts: {[key: string]: {[key: string]: string}} = {
                '058': { '0123456789': 'JANE DOE', '1234567890': 'MARY ANNE' },
                '044': { '0987654321': 'JOHN SMITH', '9876543210': 'ADAMU CIROMA' },
                '033': { '1122334455': 'ALICE WONDER', '2233445566': 'NGOZI OKONJO' },
                '011': { '5566778899': 'PETER JONES', '6677889900': 'BOLANLE AUSTEN-PETERS' },
                '057': { '1112223334': 'CHIOMA AKINWUMI' }
            };

            if (mockAccounts[watchedBankCode] && mockAccounts[watchedBankCode][watchedAccountNumber]) {
                setRecipientName(mockAccounts[watchedBankCode][watchedAccountNumber]);
                clearErrors('accountNumber');
            } else {
                setRecipientName(null);
                setError('accountNumber', { type: 'manual', message: 'Account not found. Please check the details and try again.' });
            }
            setIsVerifying(false);
        }, 500);
    } else {
        setIsVerifying(false);
    }
    
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }
  }, [watchedAccountNumber, watchedBankCode, clearErrors, setError]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        form.setValue('photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(data: FormData) {
    if (!recipientName) {
      setError('accountNumber', { type: 'manual', message: 'Please wait for account verification to complete.' });
      return;
    }
    const dataWithPhoto = { ...data, photo: photoPreview };
    setSubmittedData(dataWithPhoto);
    setStep('summary');
  }

  const handleConfirmWithdrawal = () => setStep('receipt');
  const resetForm = () => {
    setStep('form');
    setSubmittedData(null);
    setPhotoPreview(null);
    setRecipientName(null);
    setIsMemoTransfer(false);
    form.reset();
  };

  if (step === 'receipt' && submittedData && recipientName) {
    return <WithdrawalReceipt data={submittedData} recipientName={recipientName} onReset={resetForm} />;
  }

  if (step === 'summary' && submittedData && recipientName) {
    const bankName = nigerianBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Withdrawal Summary</CardTitle>
          <CardDescription>Please review the details before confirming.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Recipient</span><span className="font-semibold">{recipientName}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Bank</span><span className="font-semibold">{bankName}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Account Number</span><span className="font-semibold">{submittedData.accountNumber}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Amount</span><span className="font-bold text-lg text-primary">₦{submittedData.amount.toLocaleString()}</span></div>
          {submittedData.narration && (<div className="flex justify-between items-center"><span className="text-muted-foreground">Narration</span><span className="font-semibold">{submittedData.narration}</span></div>)}
          {isMemoTransfer && submittedData.photo && (<div className="space-y-2"><span className="text-muted-foreground">Attached Photo</span><div className="relative w-full h-32 rounded-lg overflow-hidden"><Image src={submittedData.photo as string} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="person" /></div></div>)}
          {isMemoTransfer && submittedData.message && (<div className="space-y-2"><span className="text-muted-foreground">Message</span><blockquote className="border-l-2 pl-2 italic">"{submittedData.message}"</blockquote></div>)}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={() => setStep('form')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button className="w-full" onClick={handleConfirmWithdrawal}>Confirm Withdrawal</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert><Info className="h-4 w-4" /><AlertTitle>For Testing</AlertTitle><AlertDescription><p className="mb-2">Use one of these bank/account pairs for successful verification:</p><ul className="list-disc pl-5 space-y-1 text-xs"><li><b>GTB (058):</b> 0123456789, 1234567890</li><li><b>Access Bank (044):</b> 0987654321, 9876543210</li></ul></AlertDescription></Alert>
        <div className="flex items-center space-x-2 justify-end"><Label htmlFor="memo-switch">Add Memo</Label><Switch id="memo-switch" checked={isMemoTransfer} onCheckedChange={setIsMemoTransfer} /></div>
        <FormField control={form.control} name="bankCode" render={({ field }) => (
            <FormItem><FormLabel>Recipient's Bank</FormLabel>
                <Popover open={isBankPopoverOpen} onOpenChange={setIsBankPopoverOpen}>
                  <PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{field.value ? nigerianBanks.find(bank => bank.code === field.value)?.name : "Select a bank"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search for a bank..." value={bankSearchQuery} onValueChange={setBankSearchQuery} /><CommandList><CommandEmpty>No bank found.</CommandEmpty>
                        {filteredTopBanks.length > 0 && (<CommandGroup heading="Top Banks">{filteredTopBanks.map(bank => (<CommandItem key={bank.code} value={bank.name} onSelect={() => { setValue("bankCode", bank.code); setIsBankPopoverOpen(false); setBankSearchQuery(""); }}><Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />{bank.name}</CommandItem>))}</CommandGroup>)}
                        {(filteredTopBanks.length > 0 && filteredOtherBanks.length > 0) && <CommandSeparator />}
                        {filteredOtherBanks.length > 0 && (<CommandGroup heading="All Banks">{filteredOtherBanks.map(bank => (<CommandItem key={bank.code} value={bank.name} onSelect={() => { setValue("bankCode", bank.code); setIsBankPopoverOpen(false); setBankSearchQuery(""); }}><Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />{bank.name}</CommandItem>))}</CommandGroup>)}
                  </CommandList></Command></PopoverContent>
                </Popover><FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="accountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><div className="relative"><FormControl><Input placeholder="10-digit account number" {...field} /></FormControl>{isVerifying && (<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />)}</div>{recipientName && !isVerifying && (<div className="text-green-600 bg-green-500/10 p-2 rounded-md text-sm font-semibold mt-1">{recipientName}</div>)}<FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="narration" render={({ field }) => (<FormItem><FormLabel>Narration (Optional)</FormLabel><FormControl><Input placeholder="e.g., For groceries" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        {isMemoTransfer && (
          <div className="space-y-4 pt-4 border-t"><h3 className="font-semibold text-lg">Memo Details</h3><FormField control={form.control} name="photo" render={() => (<FormItem><FormLabel>Add a Photo</FormLabel><FormControl><div className="relative"><Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="absolute h-full w-full opacity-0 cursor-pointer" /><label htmlFor="photo-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">{photoPreview ? (<Image src={photoPreview} alt="Preview" width={100} height={100} className="object-contain h-full" data-ai-hint="person" />) : (<div className="text-center text-muted-foreground"><Upload className="mx-auto h-8 w-8" /><p>Click to upload</p></div>)}</label></div></FormControl><FormMessage /></FormItem>)}/><FormField control={form.control} name="message" render={({ field }) => (<FormItem><FormLabel>Custom Message (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Enjoy the gift!" {...field} /></FormControl><FormMessage /></FormItem>)}/></div>
        )}
        <Button type="submit" className="w-full !mt-6" disabled={isVerifying || !recipientName}>Continue</Button>
      </form>
    </Form>
  );
}

function WithdrawalReceipt({ data, recipientName, onReset }: { data: FormData; recipientName: string; onReset: () => void }) {
  const { toast } = useToast();
  const bankName = data.bankCode ? (nigerianBanks.find(b => b.code === data.bankCode)?.name || 'Unknown Bank') : 'Ovomonie';
  const handleShare = () => toast({ title: "Shared!", description: "Your withdrawal receipt has been shared." });

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20">
      <div className="bg-slate-900 text-white p-4 rounded-t-lg flex justify-between items-center"><h2 className="text-lg font-bold">Withdrawal Successful!</h2><Landmark className="w-6 h-6" /></div>
      <CardContent className="p-4 bg-white"><div className="border-2 border-blue-100 rounded-lg p-4 space-y-4">
          {data.photo && (<div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden"><Image src={data.photo as string} alt="Memorable moment" layout="fill" objectFit="cover" data-ai-hint="celebration event" /></div>)}
          <div className="text-center space-y-1"><p className="text-sm text-gray-500">You withdrew</p><p className="text-4xl font-bold text-slate-800">₦{data.amount.toLocaleString()}</p><p className="text-sm text-gray-500">to</p><p className="text-lg font-semibold text-slate-800">{recipientName}</p><p className="text-sm text-gray-500">{bankName}</p></div>
          {data.message && (<blockquote className="mt-4 border-l-4 border-blue-200 pl-4 italic text-center text-gray-600">"{data.message}"</blockquote>)}
          <div className="text-xs text-gray-400 pt-4 space-y-2"><div className="flex justify-between"><span>Date</span><span>{new Date().toLocaleString()}</span></div><div className="flex justify-between"><span>Ref ID</span><span>OVO-WTH-{Date.now()}</span></div></div>
      </div></CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0"><p className="text-xs text-gray-400 mb-2">Powered by Ovomonie</p><Button className="w-full" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Share Receipt</Button><Button variant="outline" className="w-full" onClick={onReset}>Make Another Withdrawal</Button></CardFooter>
    </Card>
  );
}

function AtmCardlessWithdrawal() {
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof amountSchema>>({
        resolver: zodResolver(amountSchema),
        defaultValues: { amount: 0 },
    });

    useEffect(() => {
        if (!generatedCode) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGeneratedCode(null);
                    toast({ title: 'Code Expired', description: 'Your cardless withdrawal code has expired.'});
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [generatedCode, toast]);

    const handleGenerateCode = (data: z.infer<typeof amountSchema>) => {
        if (data.amount > 0) {
            const code = Array(3).fill(0).map(() => Math.floor(Math.random() * 900 + 100).toString()).join('-');
            setGeneratedCode(code);
            setTimeLeft(300); // 5 minutes
            toast({ title: 'Code Generated!', description: 'Your cardless withdrawal code is ready.'});
        }
    };

    if (generatedCode) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return (
            <div className="text-center space-y-4">
                <p>Use the code below at a supported ATM:</p>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold tracking-widest">{generatedCode}</p>
                </div>
                <p className="font-semibold text-destructive">Expires in: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</p>
                <Button onClick={() => { setGeneratedCode(null); form.reset(); }}>Done</Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerateCode)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 10000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Generate Code</Button>
            </form>
        </Form>
    );
}

function PosAgentWithdrawal() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof posAgentSchema>>({
        resolver: zodResolver(posAgentSchema),
        defaultValues: {
            agentId: '',
            amount: 0,
        }
    });

    function onSubmit(data: z.infer<typeof posAgentSchema>) {
        toast({
            title: "Withdrawal Requested",
            description: `Withdrawal of ₦${data.amount} from agent ${data.agentId} has been requested.`,
            variant: "default",
        });
        form.reset();
    }
    
    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="agentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agent ID</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter agent ID" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Request Withdrawal</Button>
            </form>
        </Form>
    )
}

function UssdWithdrawal() {
    const [ussdString, setUssdString] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof amountSchema>>({
        resolver: zodResolver(amountSchema),
        defaultValues: { amount: 0 }
    });

    const handleGenerate = (data: z.infer<typeof amountSchema>) => {
        if (data.amount > 0) {
            setUssdString(`*894*${data.amount}*12345#`); // Mock code
        }
    }

    const copyToClipboard = () => {
        if(ussdString) {
            navigator.clipboard.writeText(ussdString);
            toast({title: "Copied!", description: "USSD code copied to clipboard."})
        }
    }

    if (ussdString) {
        return (
            <div className="text-center space-y-4">
                <p>Dial the code below on your mobile phone:</p>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-2xl font-bold tracking-widest">{ussdString}</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => { setUssdString(null); form.reset(); }} variant="outline" className="w-full">Back</Button>
                    <Button onClick={copyToClipboard} className="w-full">Copy Code</Button>
                </div>
            </div>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 2000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Generate USSD Code</Button>
            </form>
        </Form>
    );
}

function QrCodeWithdrawal() {
     const [amount, setAmount] = useState(0);
     const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

     const form = useForm<z.infer<typeof amountSchema>>({
        resolver: zodResolver(amountSchema),
        defaultValues: { amount: 0 }
     });

     const handleGenerate = (data: z.infer<typeof amountSchema>) => {
        if(data.amount > 0) {
            setAmount(data.amount);
            setQrCodeUrl(`https://placehold.co/256x256.png`);
        }
     }

     if(qrCodeUrl) {
         return (
            <div className="text-center space-y-4">
                <p>Have the agent or ATM scan this QR code.</p>
                <div className="bg-white p-4 inline-block rounded-lg">
                    <Image src={qrCodeUrl} alt="Withdrawal QR Code" width={256} height={256} data-ai-hint="qr code" />
                </div>
                <p className="font-bold text-xl">Amount: ₦{amount.toLocaleString()}</p>
                <Button onClick={() => { setQrCodeUrl(null); form.reset(); }} className="w-full">Done</Button>
            </div>
         );
     }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 15000" {...field} value={field.value === 0 ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Generate QR Code</Button>
            </form>
        </Form>
    );
}


export function WithdrawForm() {
    return (
        <Tabs defaultValue="bank" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="bank"><Landmark className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Bank</span></TabsTrigger>
                <TabsTrigger value="atm"><Code className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">ATM</span></TabsTrigger>
                <TabsTrigger value="pos"><Store className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">Agent</span></TabsTrigger>
                <TabsTrigger value="ussd"><Hash className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">USSD</span></TabsTrigger>
                <TabsTrigger value="qr"><QrCode className="h-5 w-5 sm:mr-2" /><span className="hidden sm:inline">QR Code</span></TabsTrigger>
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
