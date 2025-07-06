
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
import { Upload, Share2, Wallet, Loader2, ArrowLeft, Info, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';

const formSchema = z.object({
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  narration: z.string().max(50, "Narration can't exceed 50 characters.").optional(),
  message: z.string().max(150, 'Message is too long.').optional(),
  photo: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

function MemoReceipt({ data, recipientName, onReset }: { data: FormData; recipientName: string; onReset: () => void }) {
  const { toast } = useToast();
  
  const handleShare = () => {
    toast({
      title: "Shared!",
      description: "Your memorable receipt has been shared.",
    });
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20">
      <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-lg font-bold">Transfer Successful!</h2>
        <Wallet className="w-6 h-6" />
      </div>
      <CardContent className="p-4 bg-card">
        <div className="border-2 border-primary-light-bg rounded-lg p-4 space-y-4">
          {data.photo && (
            <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
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
            <p className="text-sm text-muted-foreground">Ovomonie</p>
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
              <span>OVO-INT-{Date.now()}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        <p className="text-xs text-muted-foreground mb-2">Powered by Ovomonie</p>
        <Button className="w-full" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share Receipt
        </Button>
        <Button variant="outline" className="w-full" onClick={onReset}>
          Make Another Transfer
        </Button>
      </CardFooter>
    </Card>
  );
}

export function InternalTransferForm() {
  const [step, setStep] = useState<'form' | 'summary' | 'receipt'>('form');
  const [isMemoTransfer, setIsMemoTransfer] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();

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
              const res = await fetch(`/api/user/${watchedAccountNumber}`);
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

    if (balance === null || (data.amount * 100) > balance) {
        toast({
            variant: "destructive",
            title: "Insufficient Funds",
            description: `Your balance of ₦${new Intl.NumberFormat('en-NG').format((balance || 0) / 100)} is not enough for this transaction.`,
        });
        return;
    }

    const dataWithPhoto = { ...data, photo: photoPreview };
    setSubmittedData(dataWithPhoto);
    setStep('summary');
  }

  const handleFinalSubmit = async () => {
    if (!submittedData) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const clientReference = `internal-transfer-${crypto.randomUUID()}`;

      const response = await fetch('/api/transfers/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientReference,
          recipientAccountNumber: submittedData.accountNumber,
          amount: submittedData.amount,
          narration: submittedData.narration,
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
        title: 'Transfer Successful',
        description: `You sent ₦${submittedData.amount.toLocaleString()} to ${recipientName}.`,
        category: 'transaction',
      });

      updateBalance(result.data.newBalanceInKobo);
      setIsPinModalOpen(false);
      setStep('receipt');
      
    } catch (error: any) {
      let title = 'Transfer Failed';
      let description = 'An unknown error occurred.';

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        title = 'Network Error';
        description = 'Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
          title = 'Authentication Error';
          description = 'Your session has expired. Please log in again.';
          logout();
      } else if (error.message) {
          description = error.message;
          if (description.toLowerCase().includes('insufficient funds')) {
            title = 'Insufficient Funds';
          } else if (description.toLowerCase().includes('security review')) {
            title = 'Security Alert';
          }
      }
      
      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
      setIsPinModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setSubmittedData(null);
    setPhotoPreview(null);
    setRecipientName(null);
    setIsMemoTransfer(false);
    form.reset();
  };

  if (step === 'receipt' && submittedData && recipientName) {
    return <MemoReceipt data={submittedData} recipientName={recipientName} onReset={resetForm} />;
  }

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
            <Button className="w-full" onClick={() => setIsPinModalOpen(true)} disabled={isProcessing}>
              Confirm Transfer
            </Button>
          </CardFooter>
        </Card>
        
        <PinModal 
          open={isPinModalOpen} 
          onOpenChange={setIsPinModalOpen}
          onConfirm={handleFinalSubmit}
          isProcessing={isProcessing}
        />
      </>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>For Testing</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Use one of these Ovomonie account numbers for successful verification:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>0987654321</li>
                <li>1122334455</li>
              </ul>
            </AlertDescription>
          </Alert>
          
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
                  <div className="text-green-600 bg-green-50 p-2 rounded-md text-sm font-semibold mt-1 flex items-center gap-2">
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
            <FormField
              control={form.control}
              name="photo"
              render={() => (
                <FormItem>
                  <FormLabel>Add a Photo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="absolute h-full w-full opacity-0 cursor-pointer" />
                      <label htmlFor="photo-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        {photoPreview ? (
                          <Image src={photoPreview} alt="Preview" width={100} height={100} className="object-contain h-full" data-ai-hint="person" />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto h-8 w-8" />
                            <p>Click to upload</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
