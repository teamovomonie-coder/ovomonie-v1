
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { Share2, Wallet, Loader2, ArrowLeft, Landmark, Info, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nigerianBanks } from '@/lib/banks';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { generateReceiptImage } from '@/ai/flows/generate-receipt-image-flow';
import { pendingTransactionService } from '@/lib/pending-transaction-service';
import { MockAccounts } from './mock-accounts';

const formSchema = z.object({
  bankCode: z.string().min(1, 'Please select a bank.'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  narration: z.string().max(50, "Narration can't exceed 50 characters.").optional(),
  message: z.string().max(150, 'Message is too long.').optional(),
  imageTheme: z.string().optional(),
  photo: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

function MemoReceipt({ data, recipientName, onReset }: { data: FormData; recipientName: string; onReset: () => void }) {
  const { toast } = useToast();
  const bankName = nigerianBanks.find(b => b.code === data.bankCode)?.name || 'Unknown Bank';

  const handleShare = () => {
    toast({
      title: "Shared!",
      description: "Your memorable receipt has been shared.",
    });
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-none bg-transparent">
      <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-lg font-bold">MemoTransfer Receipt</h2>
        <Wallet className="w-6 h-6" />
      </div>
      <CardContent className="p-4 bg-card">
        <div className="border-2 border-primary-light-bg rounded-lg p-4 space-y-4 relative z-10">
          {data.photo && (
            <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
              <Image src={data.photo as string} alt="Memorable moment" layout="fill" objectFit="cover" data-ai-hint="celebration event" />
            </div>
          )}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">You sent</p>
            <p className="text-4xl font-bold text-foreground">
              ₦{data.amount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">to</p>
            <p className="text-lg font-semibold text-foreground">{recipientName}</p>
            <p className="text-sm text-muted-foreground">{bankName}</p>
          </div>
          {data.message && (
            <blockquote className="mt-4 border-l-4 border-primary/20 pl-4 italic text-center text-muted-foreground">
              "{data.message}"
            </blockquote>
          )}
          <div className="text-xs text-muted-foreground pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Date</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Ref ID</span>
              <span>OVO-EXT-{Date.now()}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        <p data-powered-by="ovomonie" className="text-xs text-muted-foreground mb-2">Powered by Ovomonie</p>
        <div className="no-capture space-y-2">
          <Button className="w-full" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Share Receipt
          </Button>
          <Button variant="outline" className="w-full" onClick={onReset}>
            Make Another Transfer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

const topBankCodes = ["058", "044", "057", "011", "033"];
const topBanks = nigerianBanks.filter(b => topBankCodes.includes(b.code));
const otherBanks = nigerianBanks.filter(b => !topBankCodes.includes(b.code));

export function ExternalTransferForm({ defaultMemo = false }: { defaultMemo?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'summary'>('form');
  const [isMemoTransfer, setIsMemoTransfer] = useState(defaultMemo);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { bankCode: '', accountNumber: '', amount: 0, narration: '', message: '', imageTheme: '' },
  });

  const { watch, clearErrors, setError } = form;
  const watchedAccountNumber = watch('accountNumber');
  const watchedBankCode = watch('bankCode');

  useEffect(() => {
    setRecipientName(null);
    if (watchedAccountNumber?.length !== 10) {
      clearErrors('accountNumber');
    }

    if (debounceRef.current) {
        clearTimeout(debounceRef.current);
    }
    
    if (watchedAccountNumber?.length === 10 && watchedBankCode) {
      setIsVerifying(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('ovo-auth-token');
          const res = await fetch('/api/transfers/verify-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ accountNumber: watchedAccountNumber, bankCode: watchedBankCode })
          });
          const data = await res.json();
          if (res.ok && data.ok && data.data?.accountName) {
            setRecipientName(data.data.accountName);
            clearErrors('accountNumber');
          } else {
            setRecipientName(null);
            setError('accountNumber', { type: 'manual', message: data?.message || 'Account not found. Please check the details and try again.' });
          }
        } catch (err) {
          setRecipientName(null);
          setError('accountNumber', { type: 'manual', message: 'Failed to validate account. Check your connection.' });
        } finally {
          setIsVerifying(false);
        }
      }, 500);
    } else {
        setIsVerifying(false);
    }
    
    return () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
    }
  }, [watchedAccountNumber, watchedBankCode, clearErrors, setError]);

  const handleGenerateImage = async () => {
    const theme = form.getValues('imageTheme');
    if (!theme) {
        toast({ variant: 'destructive', title: 'Theme required', description: 'Please enter a theme for the image.'});
        return;
    }
    setIsGeneratingImage(true);
    setPhotoPreview(null);
    try {
        const result = await generateReceiptImage({ prompt: theme });
        setPhotoPreview(result.imageDataUri);
        form.setValue('photo', result.imageDataUri);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Image Generation Failed', description: 'Could not generate image. Please try again.' });
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: "destructive", title: "Image Too Large", description: "Please upload an image smaller than 2MB."});
        return;
      }
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
     if (balance === null || (data.amount * 100) > balance) {
        toast({
            variant: "destructive",
            title: "Insufficient Funds",
            description: `Your balance is not enough for this transaction.`,
        });
        return;
    }
    const dataWithPhoto = { ...data, photo: photoPreview };
    setSubmittedData(dataWithPhoto);
    setStep('summary');
  }

  const handleFinalSubmit = useCallback(async () => {
    if (!submittedData || !recipientName) return;

    setApiError(null);
    setIsProcessing(true);
    
    // Clear any previous receipt data to prevent showing old receipts
    try {
      await pendingTransactionService.clearPendingReceipts();
    } catch (e) {
      console.warn('[ExternalTransfer] could not clear pending receipts', e);
    }
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const clientReference = `external-transfer-${crypto.randomUUID()}`;

      const response = await fetch('/api/transfers/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientReference,
          recipientName: recipientName,
          bankCode: submittedData.bankCode,
          accountNumber: submittedData.accountNumber,
          amount: submittedData.amount,
          narration: submittedData.narration,
          message: submittedData.message,
          photo: submittedData.photo,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        const error: any = new Error(result.message || 'An error occurred during the transfer.');
        error.response = response; 
        throw error;
      }

      toast({
        title: 'Transfer Successful!',
        description: `₦${submittedData.amount.toLocaleString()} sent to ${recipientName}.`,
      });

      addNotification({
        title: 'External Transfer Successful',
        description: `You sent ₦${submittedData.amount.toLocaleString()} to ${recipientName}.`,
        category: 'transaction',
      });

      updateBalance(result.data.newBalanceInKobo);
      setIsPinModalOpen(false);

      // Save pending receipt to database and localStorage, then navigate to success page
      try {
        const bankName = nigerianBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
        const pendingReceipt: any = {
          type: isMemoTransfer ? 'memo-transfer' : 'external-transfer',
          data: submittedData,
          recipientName,
          bankName,
          reference: `ext-${Date.now()}`,
          amount: submittedData.amount,
          transactionId: result.data.transactionId || `OVO-EXT-${Date.now()}`,
          completedAt: new Date().toLocaleString(),
        };
        await pendingTransactionService.savePendingReceipt(pendingReceipt);
      } catch (e) {
        console.warn('[ExternalTransfer] could not save pending receipt', e);
      }

      // Navigate to success page
      router.push('/success');
      
    } catch (error: any) {
      let description = 'An unknown error occurred.';

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        description = 'Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
          description = 'Your session has expired. Please log in again.';
          logout();
      } else if (error.message) {
          description = error.message;
      }
      
      setApiError(description);

    } finally {
      setIsProcessing(false);
    }
  }, [addNotification, logout, recipientName, submittedData, toast, updateBalance, router, isMemoTransfer]);


  const resetForm = useCallback(() => {
    setStep('form');
    setSubmittedData(null);
    setPhotoPreview(null);
    setRecipientName(null);
    setIsMemoTransfer(defaultMemo);
    form.reset();
  }, [defaultMemo, form]);

  if (step === 'summary' && submittedData && recipientName) {
    const bankName = nigerianBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
    return (
      <>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Transfer Summary</CardTitle>
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
            <Button variant="outline" className="w-full" onClick={() => setStep('form')} disabled={isProcessing}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button className="w-full" onClick={async () => {
                try {
                  if (submittedData && recipientName) {
                    const bankName = nigerianBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
                    const pendingReceipt: any = {
                      type: isMemoTransfer ? 'memo-transfer' : 'external-transfer',
                      data: submittedData,
                      recipientName,
                      bankName,
                      reference: `ext-${Date.now()}`,
                      amount: submittedData.amount,
                      createdAt: new Date().toISOString(),
                      status: 'pending',
                    };
                    await pendingTransactionService.savePendingReceipt(pendingReceipt);
                  }
                } catch (e) { 
                  console.error('[ExternalTransfer] failed to set provisional pending receipt', e); 
                }
                setIsPinModalOpen(true);
              }} disabled={isProcessing}>
                Confirm Transfer
              </Button>
          </CardFooter>
        </Card>
        <PinModal
            open={isPinModalOpen}
            onOpenChange={setIsPinModalOpen}
            onConfirm={handleFinalSubmit}
            isProcessing={isProcessing}
            error={apiError}
            onClearError={() => setApiError(null)}
            title="Authorize External Transfer"
            description={`Enter your PIN to transfer ₦${submittedData?.amount.toLocaleString()} to ${recipientName}`}
        />
      </>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <MockAccounts 
          onSelectAccount={(account) => {
            form.setValue('bankCode', account.bankCode);
            form.setValue('accountNumber', account.accountNumber);
            // Trigger validation
            form.trigger(['bankCode', 'accountNumber']);
          }}
        />
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Bank Transfer via VFD</AlertTitle>
            <AlertDescription>
              <p className="text-sm">Account verification and transfers are powered by VFD Banking API for secure, real-time bank transfers.</p>
            </AlertDescription>
          </Alert>
          
        {!defaultMemo && (
            <div className="flex items-center space-x-2 justify-end">
                <Label htmlFor="memo-switch">Use MemoTransfer</Label>
                <Switch id="memo-switch" checked={isMemoTransfer} onCheckedChange={setIsMemoTransfer} />
            </div>
        )}

        <FormField
          control={form.control}
          name="bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient's Bank</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Top Banks</SelectLabel>
                            {topBanks.map(bank => (
                                <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>All Banks</SelectLabel>
                             {otherBanks.map(bank => (
                                <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient's Account Number</FormLabel>
              <div className="relative">
                  <FormControl>
                      <Input placeholder="10-digit account number" {...field} />
                  </FormControl>
                  {isVerifying && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                  )}
              </div>
              {recipientName && !isVerifying && (
                  <div className="text-green-600 bg-green-500/10 p-2 rounded-md text-sm font-semibold mt-1 flex items-center gap-2">
                     <Check className="h-4 w-4" /> {recipientName}
                  </div>
              )}
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
                <Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="narration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Narration (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., For groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isMemoTransfer && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">MemoTransfer Details</h3>
            <div className="grid md:grid-cols-2 gap-4 items-end">
                 <FormField control={form.control} name="imageTheme" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generate Image from Theme</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                            <Input placeholder="e.g., Birthday celebration" {...field} />
                        </FormControl>
                        <Button type="button" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                            {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="relative text-center before:hidden md:before:absolute md:before:content-['OR'] md:before:-left-4 md:before:top-1/2 md:before:-translate-y-1/2 md:before:text-muted-foreground md:before:font-bold">
                    <FormField control={form.control} name="photo" render={() => (
                        <FormItem><FormLabel>Upload Your Photo</FormLabel>
                            <FormControl>
                                <Input id="photo-upload" type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light-bg file:text-primary hover:file:bg-primary/20" onChange={handlePhotoUpload} />
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
            </div>

             {photoPreview && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <Image src={photoPreview} alt="Generated Preview" layout="fill" objectFit="cover" data-ai-hint="celebration" />
                </div>
            )}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Happy Birthday! Enjoy." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full !mt-6" disabled={isVerifying || !recipientName}>
          Continue
        </Button>
      </form>
    </Form>
  );
}
