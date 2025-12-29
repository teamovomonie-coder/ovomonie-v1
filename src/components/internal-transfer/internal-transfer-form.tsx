
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
              const token = localStorage.getItem('ovo-auth-token');
              if (!token) {
                setError('accountNumber', { type: 'manual', message: 'Please log in again.' });
                setRecipientName(null);
                return;
              }
              
              const normalAccountNumber = displayToAccountNumber(watchedAccountNumber);
              const res = await fetch(`/api/user/${normalAccountNumber}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
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
      
      const clientReference = `internal-transfer-${crypto.randomUUID()}`;

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

      // Navigate to success page
      router.push('/success');
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
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#001f3f] to-[#003366] text-white pb-8">
            <CardTitle className="text-xl">Confirm Transfer</CardTitle>
            <CardDescription className="text-white/80">Review details before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 pb-6">
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Recipient</span>
                <span className="font-semibold text-gray-900">{recipientName}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Bank</span>
                <span className="font-semibold text-gray-900">Ovomonie</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Account Number</span>
                <span className="font-mono font-semibold text-gray-900">{submittedData.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-bold text-2xl text-[#001f3f]">₦{submittedData.amount.toLocaleString()}</span>
              </div>
            </div>
            
            {submittedData.narration && (
              <div className="bg-blue-50 rounded-lg p-4">
                <span className="text-xs text-gray-600 block mb-1">Narration</span>
                <span className="font-medium text-gray-900">{submittedData.narration}</span>
              </div>
            )}
            
            {isMemoTransfer && submittedData.photo && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Attached Photo</span>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image src={submittedData.photo as string} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="person" />
                </div>
              </div>
            )}
            {isMemoTransfer && submittedData.message && (
              <div className="bg-purple-50 rounded-lg p-4">
                <span className="text-xs text-gray-600 block mb-2">Message</span>
                <blockquote className="border-l-4 border-purple-400 pl-3 italic text-gray-700">"{submittedData.message}"</blockquote>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3 px-6 pb-6">
            <Button variant="outline" className="w-full py-6 border-2" onClick={() => setStep('form')} disabled={isProcessing}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button className="w-full py-6 bg-[#001f3f] hover:bg-[#001f3f]/90 text-white font-semibold shadow-lg" onClick={async () => {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Transfer Details</h2>
              <p className="text-sm text-slate-600">Send money securely to any Ovomonie account</p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Wallet className="h-6 w-6 text-slate-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-300 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-200 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <Label htmlFor="memo-switch" className="text-sm font-semibold text-slate-700">Enable MemoTransfer</Label>
                  <p className="text-xs text-slate-500">Add photos and messages to your transfer</p>
                </div>
              </div>
              <Switch 
                id="memo-switch" 
                checked={isMemoTransfer} 
                onCheckedChange={setIsMemoTransfer}
                className="data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-slate-300"
              />
            </div>
          </div>

          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    Recipient Account Number
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="Enter 10-digit account number" 
                        {...field} 
                        className="h-12 pl-4 pr-12 text-base border-2 border-slate-200 focus:border-slate-600 focus:ring-4 focus:ring-slate-200 rounded-xl transition-all bg-white"
                      />
                    </FormControl>
                    {isVerifying && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-slate-600" />
                    )}
                  </div>
                  {recipientName && !isVerifying && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl mt-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="h-4 w-4" /> 
                        <span className="font-semibold">{recipientName}</span>
                      </div>
                    </div>
                  )}
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
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
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                        className="h-12 pl-8 pr-4 text-base border-2 border-slate-200 focus:border-slate-600 focus:ring-4 focus:ring-slate-200 rounded-xl transition-all bg-white"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="narration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Description (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's this transfer for?" 
                      {...field} 
                      className="h-12 px-4 text-base border-2 border-slate-200 focus:border-slate-600 focus:ring-4 focus:ring-slate-200 rounded-xl transition-all bg-white"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {isMemoTransfer && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-200 p-3 rounded-xl">
                <Sparkles className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">MemoTransfer Details</h3>
                <p className="text-sm text-slate-600">Make your transfer memorable</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="imageTheme" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Generate Image Theme</FormLabel>
                  <div className="flex gap-3">
                    <FormControl>
                      <Input 
                        placeholder="e.g., Birthday celebration" 
                        {...field} 
                        className="h-12 px-4 text-base border-2 border-slate-200 focus:border-slate-600 focus:ring-4 focus:ring-slate-200 rounded-xl transition-all bg-white"
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      onClick={handleGenerateImage} 
                      disabled={isGeneratingImage}
                      className="h-12 px-6 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all"
                    >
                      {isGeneratingImage ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </Button>
                  </div>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
              />

              <FormField control={form.control} name="photo" render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Upload Photo</FormLabel>
                  <FormControl>
                    <Input 
                      id="photo-upload" 
                      type="file" 
                      accept="image/*" 
                      className="h-12 px-4 text-base border-2 border-slate-200 focus:border-slate-600 focus:ring-4 focus:ring-slate-200 rounded-xl transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700 file:font-semibold hover:file:bg-slate-300" 
                      onChange={handlePhotoUpload} 
                    />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {photoPreview && (
              <div className="mt-6 relative w-full h-40 rounded-xl overflow-hidden border-2 border-slate-300">
                <Image src={photoPreview} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="celebration" />
              </div>
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel className="text-sm font-semibold text-slate-700">Personal Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a personal message to your transfer..." 
                      {...field} 
                      className="min-h-[100px] px-4 py-3 text-base border-2 border-slate-200 focus:border-slate-600 focus:ring-4 focus:ring-slate-200 rounded-xl transition-all bg-white resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="pt-6">
          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
            disabled={isVerifying || !recipientName}
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Verifying Account...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Continue Transfer</span>
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </div>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
