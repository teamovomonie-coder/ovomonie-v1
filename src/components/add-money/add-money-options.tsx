
"use client";

import { useState, useEffect } from 'react';
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
import { Landmark, CreditCard, Hash, QrCode, Store, Copy, Share2, Loader2, CheckCircle, Timer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/context/notification-context';
import { VFDCardPayment } from './vfd-card-payment';

// --- Mock Agent Data ---
const mockAgents = {
  'AG-1234': 'Grace Okon - Lekki Phase 1',
  'AG-5678': 'Tunde Bello - Ikeja City Mall',
  'AG-9012': 'Amina Yusuf - Abuja Central',
};


// --- Bank Transfer Tab ---
function BankTransfer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    reference: string;
  } | null>(null);

  // Fetch VFD bank transfer details on mount
  useEffect(() => {
    async function fetchBankDetails() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/funding/bank-transfer');
        const result = await response.json();
        
        if (result.success && result.data) {
          setBankDetails({
            bankName: result.data.bankName,
            accountName: result.data.accountName,
            accountNumber: result.data.accountNumber,
            reference: result.data.reference
          });
        } else {
          // Fallback to user's account details
          setBankDetails({
            bankName: 'VFD Microfinance Bank',
            accountName: user?.fullName.toUpperCase() || 'OVOMONIE LIMITED',
            accountNumber: user?.accountNumber || '1001651308',
            reference: `OVO-${Date.now()}`
          });
        }
      } catch (error) {
        console.error('Error fetching bank details:', error);
        // Fallback
        setBankDetails({
          bankName: 'VFD Microfinance Bank',
          accountName: user?.fullName.toUpperCase() || 'OVOMONIE LIMITED',
          accountNumber: user?.accountNumber || '1001651308',
          reference: `OVO-${Date.now()}`
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBankDetails();
  }, [user]);

  const accountDetails = bankDetails || {
    bankName: 'VFD Microfinance Bank',
    accountName: 'Loading...',
    accountNumber: '...',
    reference: ''
  };

  const textToCopy = `Bank: ${accountDetails.bankName}\nAccount Name: ${accountDetails.accountName}\nAccount Number: ${accountDetails.accountNumber}${accountDetails.reference ? `\nReference: ${accountDetails.reference}` : ''}`;

  const copyDetails = () => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied!', description: 'Account details copied to clipboard.' });
  };
  
  const shareDetails = async () => {
      if(navigator.share) {
          try {
            await navigator.share({
                title: 'Ovomonie Funding Account',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading bank details...</span>
      </div>
    );
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
        {accountDetails.reference && (
          <div className="flex justify-between text-sm border-t pt-2 mt-2">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono text-xs">{accountDetails.reference}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
        💡 Include the reference in your transfer narration for faster crediting
      </p>
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
    const { updateBalance, logout } = useAuth();
    const { addNotification } = useNotifications();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [fundingData, setFundingData] = useState<CardFormData | null>(null);
    const [receiptData, setReceiptData] = useState<{ amount: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const form = useForm<CardFormData>({
        resolver: zodResolver(cardSchema),
        defaultValues: { amount: 0, cardNumber: '', expiry: '', cvv: '' }
    });
    
    function onSubmit(data: CardFormData) {
        // Clear any stale pending receipt to prevent wrong success page
        try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {}
        setFundingData(data);
        setIsPinModalOpen(true);
    }

    async function handleConfirmFunding(pin?: string) {
        if (!fundingData) return;
        
        setIsProcessing(true);
        setApiError(null);

        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error('Authentication token not found.');

            const clientReference = `card-deposit-${crypto.randomUUID()}`;
            const response = await fetch('/api/funding/card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    amount: fundingData.amount,
                    clientReference: clientReference,
                    cardNumber: fundingData.cardNumber.replace(/\s+/g, ''),
                    expiry: fundingData.expiry,
                    cvv: fundingData.cvv,
                    cardPin: pin || '',
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Card funding failed.');
            }

            // If VFD requires further action (OTP/redirect), handle it
            if (result.vfd) {
                // Try OTP flow first
                const otp = window.prompt('Enter the OTP sent to your phone');
                if (!otp) throw new Error('OTP required to complete this transaction.');

                const validateRes = await fetch('/api/funding/card/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ otp, reference: clientReference }),
                });

                const validateJson = await validateRes.json();
                if (!validateRes.ok) throw new Error(validateJson.message || 'OTP validation failed.');

                if (validateJson.newBalanceInKobo) {
                    updateBalance(validateJson.newBalanceInKobo);
                }

                addNotification({
                    title: 'Wallet Funded',
                    description: `You successfully added ₦${fundingData.amount.toLocaleString()} to your wallet.`,
                    category: 'transaction',
                });

                toast({
                    title: 'Funding Successful',
                    description: `₦${fundingData.amount.toLocaleString()} added to your wallet.`,
                });

                setReceiptData({ amount: fundingData.amount });
                setIsPinModalOpen(false);
                return;
            }

            // Completed synchronously
            if (result.newBalanceInKobo) {
                updateBalance(result.newBalanceInKobo);
            }
            addNotification({
                title: 'Wallet Funded',
                description: `You successfully added ₦${fundingData.amount.toLocaleString()} to your wallet.`,
                category: 'transaction',
            });

            toast({
                title: 'Funding Successful',
                description: `₦${fundingData.amount.toLocaleString()} added to your wallet.`,
            });

            setReceiptData({ amount: fundingData.amount });
            setIsPinModalOpen(false);

        } catch (error) {
            let description = 'An unknown error occurred.';
            if (error instanceof Error) description = error.message;
            setApiError(description);
        } finally {
            setIsProcessing(false);
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
                     <Button type="submit" className="w-full">
                        Fund Wallet
                     </Button>
                </form>
            </Form>
            <PinModal
                open={isPinModalOpen}
                onOpenChange={setIsPinModalOpen}
                onConfirm={handleConfirmFunding}
                isProcessing={isProcessing}
                error={apiError}
                onClearError={() => setApiError(null)}
                title="Authorize Card Deposit"
                description="Please enter your 4-digit PIN to authorize this deposit."
                successUrl={null}
            />
        </>
    );
}

// --- USSD Tab ---
function FundWithUssd() {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const { toast } = useToast();
    
    const accountNumber = user?.accountNumber || 'YOUR_ACCOUNT';

    const ussdBanks = [
        { name: 'Access Bank', code: `*901*000*Amount*${accountNumber}#` },
        { name: 'GTBank', code: `*737*50*Amount*${accountNumber}#` },
        { name: 'FirstBank', code: `*894*Amount*${accountNumber}#` },
        { name: 'UBA', code: `*919*4*Amount*${accountNumber}#` },
        { name: 'Zenith Bank', code: `*966*Amount*${accountNumber}#` },
    ];

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
    const { user } = useAuth();
    const [qrData, setQrData] = useState<{url: string; amount?: number; expiry: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const form = useForm<z.infer<typeof qrSchema>>({
        resolver: zodResolver(qrSchema),
        defaultValues: { amount: 0 }
    });

    useEffect(() => {
        if (!qrData || !qrData.expiry) return;

        const timerId = setInterval(() => {
            const now = Date.now();
            const remaining = Math.round((qrData.expiry - now) / 1000);
            if (remaining > 0) {
                setTimeLeft(remaining);
            } else {
                setTimeLeft(0);
                clearInterval(timerId);
                setQrData(null);
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [qrData]);


    const generateQr = (data: z.infer<typeof qrSchema>) => {
        const amount = data.amount && data.amount > 0 ? data.amount : undefined;
        const payload = {
            accountNumber: user?.accountNumber,
            accountName: user?.fullName,
            amount,
        };
        const qrText = encodeURIComponent(JSON.stringify(payload));
        const url = `https://placehold.co/256x256.png?text=Scan%20Me`;
        const expiry = amount ? Date.now() + 5 * 60 * 1000 : 0;
        setQrData({ url, amount, expiry });
        if (expiry) setTimeLeft(300);
    };

    if (qrData) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return (
            <div className="text-center space-y-4">
                <p>Let others scan this QR code to fund your wallet.</p>
                <div className="bg-white p-4 inline-block rounded-lg shadow-md">
                    <Image src={qrData.url} alt="Funding QR Code" width={256} height={256} data-ai-hint="qr code" />
                </div>
                {qrData.amount && <p className="text-2xl font-bold">Amount: ₦{qrData.amount.toLocaleString()}</p>}
                {qrData.expiry > 0 && (
                    <div className="flex items-center justify-center gap-2 font-mono text-destructive p-2 bg-destructive/10 rounded-md">
                        <Timer className="w-5 h-5" />
                        <span>Code expires in: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
                    </div>
                )}
                <Button onClick={() => { setQrData(null); form.reset(); }} className="w-full">Generate New Code</Button>
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
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedAgent, setVerifiedAgent] = useState<string | null>(null);
    const [fundingData, setFundingData] = useState<z.infer<typeof agentSchema> | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<{ amount: number } | null>(null);
    const { updateBalance } = useAuth();
    const { addNotification } = useNotifications();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: { agentId: '', amount: 0 }
    });
    
    const handleVerifyAgent = async () => {
        const agentId = form.getValues('agentId');
        if (!agentId) {
            form.setError('agentId', { message: 'Please enter an agent ID.' });
            return;
        }
        setIsVerifying(true);
        setVerifiedAgent(null);
        await new Promise(res => setTimeout(res, 1000));
        
        const agentName = mockAgents[agentId as keyof typeof mockAgents];
        if (agentName) {
            setVerifiedAgent(agentName);
            toast({ title: 'Agent Verified', description: `Agent: ${agentName}` });
        } else {
            toast({ variant: 'destructive', title: 'Verification Failed', description: 'Could not find an agent with that ID.' });
            form.setError('agentId', { message: 'Agent not found.' });
        }
        setIsVerifying(false);
    }

    const onSubmit = (data: z.infer<typeof agentSchema>) => {
        if (!verifiedAgent) {
            toast({ variant: 'destructive', title: 'Verification Required', description: 'Please verify the agent before proceeding.' });
            return;
        }
        setFundingData(data);
        setIsPinModalOpen(true);
    };

    const handleConfirmFunding = async () => {
        if (!fundingData) return;

        setIsProcessing(true);
        setApiError(null);
        
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error('Authentication token not found.');
            
            const clientReference = `agent-deposit-${crypto.randomUUID()}`;
            const response = await fetch('/api/funding/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...fundingData, clientReference }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Agent deposit failed.');
            }

            updateBalance(result.newBalanceInKobo);
            addNotification({
                title: 'Agent Deposit Successful',
                description: `You deposited ₦${fundingData.amount.toLocaleString()} via an agent.`,
                category: 'transaction',
            });
            
            setReceiptData({ amount: fundingData.amount });
            setIsPinModalOpen(false);

        } catch (error) {
            let description = 'An unknown error occurred.';
            if (error instanceof Error) description = error.message;
            setApiError(description);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDone = () => {
        setReceiptData(null);
        setVerifiedAgent(null);
        setFundingData(null);
        form.reset();
    };

    if (receiptData) {
        return <FundingReceipt amount={receiptData.amount} onDone={handleDone} />;
    }
    
    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="agentId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agent ID</FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input
                                        placeholder="Enter the agent's ID"
                                        {...field}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setVerifiedAgent(null);
                                        }}
                                        disabled={!!verifiedAgent}
                                    />
                                </FormControl>
                                <Button type="button" onClick={handleVerifyAgent} disabled={isVerifying || !!verifiedAgent}>
                                    {isVerifying && <Loader2 className="animate-spin" />}
                                    {!isVerifying && 'Verify'}
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                     )} />
                    
                    {verifiedAgent && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-md">
                            <p className="font-semibold text-sm">Verified Agent:</p>
                            <p>{verifiedAgent}</p>
                        </div>
                    )}

                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₦)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 10000" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}/></FormControl>
                            <FormMessage />
                        </FormItem>
                     )} />
                    <Button type="submit" className="w-full" disabled={!verifiedAgent}>
                        Request Deposit
                    </Button>
                </form>
            </Form>
            <PinModal
                open={isPinModalOpen}
                onOpenChange={setIsPinModalOpen}
                onConfirm={handleConfirmFunding}
                isProcessing={isProcessing}
                error={apiError}
                onClearError={() => setApiError(null)}
                title="Authorize Agent Deposit"
                successUrl={null}
            />
        </>
    );
}

// --- Main Component ---
export function AddMoneyOptions() {
  return (
    <Tabs defaultValue="bank" className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-auto">
        <TabsTrigger value="bank" className="flex-col sm:flex-row h-16 sm:h-10"><Landmark className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />Bank</TabsTrigger>
        <TabsTrigger value="card" className="flex-col sm:flex-row h-16 sm:h-10"><CreditCard className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />Card</TabsTrigger>
        <TabsTrigger value="ussd" className="flex-col sm:flex-row h-16 sm:h-10"><Hash className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />USSD</TabsTrigger>
        <TabsTrigger value="qr" className="flex-col sm:flex-row h-16 sm:h-10"><QrCode className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />QR Code</TabsTrigger>
        <TabsTrigger value="agent" className="flex-col sm:flex-row h-16 sm:h-10"><Store className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />Agent</TabsTrigger>
      </TabsList>
      <TabsContent value="bank" className="pt-6"><BankTransfer /></TabsContent>
      <TabsContent value="card" className="pt-6"><VFDCardPayment /></TabsContent>
      <TabsContent value="ussd" className="pt-6"><FundWithUssd /></TabsContent>
      <TabsContent value="qr" className="pt-6"><FundWithQr /></TabsContent>
      <TabsContent value="agent" className="pt-6"><FundWithAgent /></TabsContent>
    </Tabs>
  );
}

