
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Landmark, CreditCard, Hash, QrCode, Store, Copy, Share2, Loader2, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/context/notification-context';

// --- Bank Transfer Tab ---
function BankTransfer() {
  const { toast } = useToast();
  const accountDetails = {
    bankName: 'OVOMONIE',
    accountName: 'PAAGO DAVID',
    accountNumber: '8012345678',
  };

  const textToCopy = `Bank: ${accountDetails.bankName}\nAccount Name: ${accountDetails.accountName}\nAccount Number: ${accountDetails.accountNumber}`;

  const copyDetails = () => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied!', description: 'Account details copied to clipboard.' });
  };
  
  const shareDetails = async () => {
      if(navigator.share) {
          try {
            await navigator.share({
                title: 'Ovomonie Account Details',
                text: textToCopy
            });
          } catch (error) {
             if (error instanceof Error && error.name !== 'AbortError') {
                copyDetails();
                toast({title: 'Share Failed', description: 'Could not open share dialog. Details copied instead.'});
            }
          }
      } else {
          copyDetails();
          toast({title: 'Share Not Supported', description: 'Account details copied instead.'});
      }
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">Transfer money from any Nigerian bank app to the account details below.</p>
      <div className="p-4 rounded-lg bg-muted space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bank Name</span>
          <span className="font-semibold">{accountDetails.bankName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Account Name</span>
          <span className="font-semibold">{accountDetails.accountName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Account Number</span>
          <span className="font-semibold">{accountDetails.accountNumber}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="w-full" onClick={copyDetails}><Copy className="mr-2 h-4 w-4" /> Copy Details</Button>
        <Button className="w-full" onClick={shareDetails}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
      </div>
    </div>
  );
}

// --- Funding Receipt Component ---
function FundingReceipt({ amount, onDone }: { amount: number; onDone: () => void }) {
    const { toast } = useToast();
    const handleShare = () => {
        toast({
            title: "Shared!",
            description: "Your memorable receipt has been shared.",
        });
    }

    return (
        <div className="flex flex-col items-center text-center p-4 transition-all duration-500 ease-in-out">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold">Funding Successful</h2>
            <p className="text-muted-foreground mb-6">
                Your wallet has been credited successfully.
            </p>
            <Card className="w-full bg-muted">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Amount Added</p>
                    <p className="text-3xl font-bold">
                        ₦{amount.toLocaleString()}
                    </p>
                     <p className="text-xs text-muted-foreground mt-2">Ref: FND-{Date.now()}</p>
                </CardContent>
            </Card>
            <div className="mt-6 w-full space-y-2">
                 <Button onClick={onDone} className="w-full">
                    Done
                </Button>
                 <Button variant="outline" className="w-full" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share Receipt
                </Button>
            </div>
        </div>
    );
}

// --- Fund with Card Tab ---
const cardSchema = z.object({
  amount: z.coerce.number().min(100, 'Minimum amount is ₦100.'),
  cardNumber: z.string().regex(/^(?:\d{16})$/, 'Enter a valid 16-digit card number.'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format.'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Enter a valid CVV.'),
});

type CardFormData = z.infer<typeof cardSchema>;

function FundWithCard() {
    const { toast } = useToast();
    const { balance, updateBalance } = useAuth();
    const { addNotification } = useNotifications();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [fundingData, setFundingData] = useState<CardFormData | null>(null);
    const [receiptData, setReceiptData] = useState<{ amount: number } | null>(null);

    const form = useForm<CardFormData>({
        resolver: zodResolver(cardSchema),
        defaultValues: { amount: 0, cardNumber: '', expiry: '', cvv: '' }
    });
    
    function onSubmit(data: CardFormData) {
        if (!balance || data.amount * 100 < 0) return;
        setFundingData(data);
        setIsPinModalOpen(true);
    }

    async function handleConfirmFunding() {
        if (!fundingData) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/funding/card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: fundingData.amount }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Card funding failed.');
            }

            updateBalance(result.newBalanceInKobo);
            addNotification({
                title: 'Wallet Funded',
                description: `You successfully added ₦${fundingData.amount.toLocaleString()} to your wallet.`,
                category: 'transaction',
            });

            setReceiptData({ amount: fundingData.amount });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Funding Error',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        } finally {
            setIsProcessing(false);
            setIsPinModalOpen(false);
        }
    }
    
    const handleDone = () => {
        setReceiptData(null);
        form.reset();
        setFundingData(null);
    }

    if (receiptData) {
        return <FundingReceipt amount={receiptData.amount} onDone={handleDone} />;
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                     )} />
                     <FormField control={form.control} name="cardNumber" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                     )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="expiry" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <FormControl><Input placeholder="MM/YY" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="cvv" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CVV</FormLabel>
                                <FormControl><Input placeholder="123" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                     <Button type="submit" className="w-full" disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Fund Wallet
                     </Button>
                </form>
            </Form>
            <PinModal
                open={isPinModalOpen}
                onOpenChange={setIsPinModalOpen}
                onConfirm={handleConfirmFunding}
                isProcessing={isProcessing}
                title="Authorize Card Deposit"
                description="Please enter your 4-digit PIN to authorize this deposit."
            />
        </>
    );
}

// --- USSD Tab ---
const ussdBanks = [
    { name: 'Access Bank', code: '*901*000*Amount*8012345678#' },
    { name: 'GTBank', code: '*737*50*Amount*1234#' },
    { name: 'FirstBank', code: '*894*Amount*8012345678#' },
    { name: 'UBA', code: '*919*4*Amount*8012345678#' },
    { name: 'Zenith Bank', code: '*966*Amount*8012345678#' },
];
function FundWithUssd() {
    const [amount, setAmount] = useState('');
    const { toast } = useToast();

    const copyCode = (code: string) => {
        if (!amount || parseInt(amount) <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount first.'});
            return;
        }
        const finalCode = code.replace('Amount', amount);
        navigator.clipboard.writeText(finalCode);
        toast({ title: 'Copied!', description: `USSD code copied: ${finalCode}` });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor='ussd-amount'>Amount (₦)</Label>
                <Input id="ussd-amount" type="number" placeholder="Enter amount to fund" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">Select your bank and copy the USSD code to dial on your phone.</p>
            <Accordion type="single" collapsible className="w-full">
                {ussdBanks.map(bank => (
                     <AccordionItem value={bank.name} key={bank.name}>
                        <AccordionTrigger>{bank.name}</AccordionTrigger>
                        <AccordionContent>
                           <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <p className="font-mono text-sm">{bank.code.replace('Amount', amount || 'Amount')}</p>
                                <Button size="sm" onClick={() => copyCode(bank.code)}>Copy</Button>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}

// --- QR Code Tab ---
const qrSchema = z.object({
    amount: z.coerce.number().optional()
});
function FundWithQr() {
    const [qrData, setQrData] = useState<{url: string, amount: number | undefined} | null>(null);

    const form = useForm<z.infer<typeof qrSchema>>({
        resolver: zodResolver(qrSchema),
        defaultValues: { amount: 0 }
    });

    const generateQr = (data: z.infer<typeof qrSchema>) => {
        const amount = data.amount && data.amount > 0 ? data.amount : undefined;
        setQrData({ url: `https://placehold.co/256x256.png`, amount });
    };

    if (qrData) {
        return (
            <div className="text-center space-y-4">
                <p>Let others scan this QR code to fund your wallet.</p>
                <div className="bg-white p-4 inline-block rounded-lg shadow-md">
                    <Image src={qrData.url} alt="Funding QR Code" width={256} height={256} data-ai-hint="qr code" />
                </div>
                {qrData.amount && <p className="text-2xl font-bold">Amount: ₦{qrData.amount.toLocaleString()}</p>}
                <Button onClick={() => setQrData(null)} className="w-full">Generate New Code</Button>
            </div>
        );
    }
    
    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(generateQr)} className="space-y-4">
                 <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="Leave blank for any amount" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
                    </FormItem>
                 )} />
                <Button type="submit" className="w-full">Generate QR Code</Button>
            </form>
        </Form>
    );
}

// --- Agent Deposit ---
const agentSchema = z.object({
    agentId: z.string().min(4, 'Enter a valid agent ID.'),
    amount: z.coerce.number().min(100, 'Minimum deposit is ₦100.'),
});

function FundWithAgent() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: { agentId: '', amount: 0 }
    });

    async function onSubmit(data: z.infer<typeof agentSchema>) {
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 2000));
        setIsLoading(false);
        toast({
            title: 'Deposit Initiated',
            description: `A request for ₦${data.amount.toLocaleString()} has been sent to agent ${data.agentId}. Please provide the cash to the agent.`
        });
        form.reset();
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="agentId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Agent ID or Phone Number</FormLabel>
                        <FormControl><Input placeholder="Enter the agent's ID" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount (₦)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 10000" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}/></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Deposit
                </Button>
            </form>
        </Form>
    );
}

// --- Main Component ---
export function AddMoneyOptions() {
  return (
    <Tabs defaultValue="bank" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
        <TabsTrigger value="bank" className="flex-col sm:flex-row h-16 sm:h-10"><Landmark className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />Bank</TabsTrigger>
        <TabsTrigger value="card" className="flex-col sm:flex-row h-16 sm:h-10"><CreditCard className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />Card</TabsTrigger>
        <TabsTrigger value="ussd" className="flex-col sm:flex-row h-16 sm:h-10"><Hash className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />USSD</TabsTrigger>
        <TabsTrigger value="qr" className="flex-col sm:flex-row h-16 sm:h-10"><QrCode className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />QR Code</TabsTrigger>
        <TabsTrigger value="agent" className="flex-col sm:flex-row h-16 sm:h-10"><Store className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />Agent</TabsTrigger>
      </TabsList>
      <TabsContent value="bank" className="pt-6"><BankTransfer /></TabsContent>
      <TabsContent value="card" className="pt-6"><FundWithCard /></TabsContent>
      <TabsContent value="ussd" className="pt-6"><FundWithUssd /></TabsContent>
      <TabsContent value="qr" className="pt-6"><FundWithQr /></TabsContent>
      <TabsContent value="agent" className="pt-6"><FundWithAgent /></TabsContent>
    </Tabs>
  );
}
