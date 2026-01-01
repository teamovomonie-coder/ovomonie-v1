
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
import { Share2, Wallet, Loader2, ArrowLeft, Info, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { generateReceiptImage } from '@/ai/flows/generate-receipt-image-flow';
import { pendingTransactionService } from '@/lib/pending-transaction-service';

import { displayToAccountNumber } from '@/lib/account-utils';
import { generateTransactionReference } from '@/lib/transaction-utils';

const formSchema = z.object({
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  narration: z.string().max(50, "Narration can't exceed 50 characters.").optional(),
  message: z.string().max(150, 'Message is too long.').optional(),
  imageTheme: z.string().optional(),
  photo: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;



export function InternalTransferForm() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'summary'>('form');
  const [isMemoTransfer, setIsMemoTransfer] = useState(false);
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
    defaultValues: { accountNumber: '', amount: 0, narration: '', message: '' },
  });

  const { watch, clearErrors, setError } = form;
  const watchedAccountNumber = watch('accountNumber');

  useEffect(() => {
    setRecipientName(null);
    if (watchedAccountNumber?.length !== 10) {
      clearErrors('accountNumber');
    }

    if (debounceRef.current) {
        clearTimeout(debounceRef.current);
    }
    
    if (watchedAccountNumber?.length === 10) {
        setIsVerifying(true);
        debounceRef.current = setTimeout(async () => {
            try {
              const normalAccountNumber = displayToAccountNumber(watchedAccountNumber);
              const res = await fetch(`/api/user/${normalAccountNumber}`);
              if (res.status === 404) {
                 setError('accountNumber', { type: 'manual', message: 'Ovomonie account not found.' });
                 setRecipientName(null);
                 return;
              }
              if (!res.ok) {
                 setError('accountNumber', { type: 'manual', message: 'Could not verify account. Please try again.' });
                 setRecipientName(null);
                 return;
              }
              const userData = await res.json();
              setRecipientName(userData.fullName);
              clearErrors('accountNumber');
            } catch (err) {
               setError('accountNumber', { type: 'manual', message: 'Could not connect to verify account.' });
               setRecipientName(null);
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
  }, [watchedAccountNumber, clearErrors, setError]);

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
            description: `Your balance of ₦${new Intl.NumberFormat('en-NG').format((balance || 0) / 100)} is not enough for this transaction.`,
        });
        return;
    }

    const dataWithPhoto = { ...data, photo: photoPreview };
    // Debugging: capture exact amount type/value to help investigate rounding issues
    try {
      console.debug('[InternalTransfer][DEBUG] Submitted amount raw', { value: data.amount, type: typeof data.amount });
    } catch (e) {}
    setSubmittedData(dataWithPhoto);
    setStep('summary');
  }

      const handleFinalSubmit = useCallback(async (pin?: string) => {
    if (!submittedData || !recipientName) return;
    if (!pin || pin.length !== 4) {
      setApiError('Please enter your 4-digit transaction PIN.');
      return;
    }

    setIsProcessing(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const clientReference = generateTransactionReference('internal-transfer');

      // Debug: log outgoing internal transfer request
      console.debug('[InternalTransfer] internal transfer request', { url: '/api/transfers/internal', tokenPresent: Boolean(token), payload: { clientReference, recipientAccountNumber: submittedData.accountNumber, amount: submittedData.amount } });

      // Normalize amount to integer (naira) to avoid floating-point/formatting issues
      const amountToSend = Math.round(submittedData.amount);
      console.debug('[InternalTransfer][DEBUG] amountToSend', { amountToSend, raw: submittedData.amount });

      const response = await fetch('/api/transfers/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientReference,
          recipientAccountNumber: displayToAccountNumber(submittedData.accountNumber),
          amount: amountToSend,
          narration: submittedData.narration,
          senderPin: pin,
        }),
      });

      const result = await response.json();
      console.debug('[InternalTransfer] internal transfer response', { status: response.status, ok: response.ok, body: result });
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
        title: 'Transfer Successful',
        description: `You sent ₦${submittedData.amount.toLocaleString()} to ${recipientName}.`,
        category: 'transaction',
      });

      updateBalance(result.data.newBalanceInKobo);
      setIsPinModalOpen(false);

      // Save pending receipt to database and localStorage, then navigate to success page
      try {
        const pendingReceipt: any = {
          type: isMemoTransfer ? 'memo-transfer' : 'internal-transfer',
          data: submittedData,
          recipientName,
          reference: `int-${Date.now()}`,
          amount: amountToSend,
          transactionId: result.data.transactionId || `OVO-INT-${Date.now()}`,
          completedAt: new Date().toLocaleString(),
        };
        await pendingTransactionService.savePendingReceipt(pendingReceipt);
      } catch (e) {
        console.warn('[InternalTransfer] could not save pending receipt', e);
      }

      // Navigate to success page with URL parameters
      const params = new URLSearchParams({
        ref: result.data.transactionId || `OVO-INT-${Date.now()}`,
        amount: amountToSend.toString(),
        type: isMemoTransfer ? 'memo-transfer' : 'internal-transfer',
        recipientName: recipientName,
        bankName: 'Ovomonie',
        accountNumber: submittedData.accountNumber,
        ...(submittedData.narration && { narration: submittedData.narration })
      });
      window.location.href = `/success?${params.toString()}`;
      return { success: true, data: result.data };
      
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
    setIsMemoTransfer(false);
    try { localStorage.removeItem('ovo-pending-receipt'); } catch (e) {}
    form.reset();
  }, [form]);

  if (step === 'summary' && submittedData && recipientName) {
    return (
      <>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Transfer Summary</CardTitle>
            <CardDescription>Please review the details before confirming.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold">{recipientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-semibold">Ovomonie</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-semibold">{submittedData.accountNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-lg text-primary">₦{submittedData.amount.toLocaleString()}</span>
            </div>
            {submittedData.narration && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Narration</span>
                <span className="font-semibold">{submittedData.narration}</span>
              </div>
            )}
            {isMemoTransfer && submittedData.photo && (
              <div className="space-y-2">
                <span className="text-muted-foreground">Attached Photo</span>
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <Image src={submittedData.photo as string} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="person" />
                </div>
              </div>
            )}
            {isMemoTransfer && submittedData.message && (
              <div className="space-y-2">
                <span className="text-muted-foreground">Message</span>
                <blockquote className="border-l-2 pl-2 italic">"{submittedData.message}"</blockquote>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={() => setStep('form')} disabled={isProcessing}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button className="w-full" onClick={async () => {
                try {
                  if (submittedData && recipientName) {
                    const receipt: any = { 
                      type: isMemoTransfer ? 'memo-transfer' : 'internal-transfer', 
                      data: submittedData, 
                      recipientName,
                      reference: `int-${Date.now()}`,
                      amount: submittedData.amount,
                    };
                    await pendingTransactionService.savePendingReceipt(receipt);
                  }
                } catch (e) {}
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
        />
      </>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center space-x-2 justify-end">
          <Label htmlFor="memo-switch">Use MemoTransfer</Label>
          <Switch id="memo-switch" checked={isMemoTransfer} onCheckedChange={setIsMemoTransfer} />
        </div>

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
                <Input placeholder="e.g., For lunch" {...field} />
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
