
"use client";

import { useState } from 'react';
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
import { Upload, Share2, Wallet, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
        <div className="bg-slate-900 text-white p-4 rounded-t-lg flex justify-between items-center">
             <h2 className="text-lg font-bold">Transfer Successful!</h2>
             <Wallet className="w-6 h-6" />
        </div>

        <CardContent className="p-4 bg-white">
            <div className="border-2 border-blue-100 rounded-lg p-4 space-y-4">
                 {data.photo && (
                  <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                    <Image src={data.photo as string} alt="Memorable moment" layout="fill" objectFit="cover" data-ai-hint="celebration event" />
                  </div>
                )}
                <div className="text-center space-y-1">
                    <p className="text-sm text-gray-500">You sent</p>
                    <p className="text-4xl font-bold text-slate-800">
                        ₦{data.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">to</p>
                    <p className="text-lg font-semibold text-slate-800">{recipientName}</p>
                </div>

                {data.message && (
                  <blockquote className="mt-4 border-l-4 border-blue-200 pl-4 italic text-center text-gray-600">
                    "{data.message}"
                  </blockquote>
                )}
                
                <div className="text-xs text-gray-400 pt-4 space-y-2">
                    <div className="flex justify-between">
                        <span>Date</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ref ID</span>
                        <span>OVO-{Date.now()}</span>
                    </div>
                </div>
            </div>
        </CardContent>
         <CardFooter className="flex flex-col gap-2 p-4 pt-0">
             <p className="text-xs text-gray-400 mb-2">Powered by Ovomonie</p>
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


export function TransferForm() {
  const [step, setStep] = useState<'form' | 'summary' | 'receipt'>('form');
  const [isMemoTransfer, setIsMemoTransfer] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { accountNumber: '', amount: undefined, narration: '', message: '' },
  });

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
  
  const handleVerifyAccount = async () => {
    const accountNumber = form.getValues('accountNumber');
    form.clearErrors('accountNumber');
    setRecipientName(null);
    setVerificationError(null);

    if (accountNumber.length !== 10) {
      form.setError('accountNumber', { type: 'manual', message: 'Account number must be 10 digits.' });
      return;
    }
    
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockInternalAccounts: {[key: string]: string} = {
        '0123456789': 'PAAGO DAVID',
        '8012345678': 'FEMI ADEBAYO',
        '1122334455': 'CHIDINMA OKORO',
        '9988776655': 'MUSA BELLO',
    };

    if (mockInternalAccounts[accountNumber]) {
       setRecipientName(mockInternalAccounts[accountNumber]);
    } else {
       setVerificationError('Account not found. Please check the number and try again.');
    }
    setIsVerifying(false);
  };

  function onSubmit(data: FormData) {
    if (!recipientName) {
        form.setError('accountNumber', {type: 'manual', message: 'Please verify the account number.'})
        return;
    }
    const dataWithPhoto = { ...data, photo: photoPreview };
    setSubmittedData(dataWithPhoto);
    setStep('summary');
  }
  
  const handleConfirmTransfer = () => {
      setStep('receipt');
  }

  const resetForm = () => {
    setStep('form');
    setSubmittedData(null);
    setPhotoPreview(null);
    setRecipientName(null);
    setVerificationError(null);
    setIsMemoTransfer(false);
    form.reset();
  }

  if (step === 'receipt' && submittedData && recipientName) {
    return <MemoReceipt data={submittedData} recipientName={recipientName} onReset={resetForm} />;
  }
  
  if (step === 'summary' && submittedData && recipientName) {
      return (
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
                 <Button variant="outline" className="w-full" onClick={() => setStep('form')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="w-full" onClick={handleConfirmTransfer}>
                    Confirm Transfer
                </Button>
            </CardFooter>
        </Card>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center space-x-2 justify-end">
            <Label htmlFor="memo-switch">Switch to MemoTransfer</Label>
            <Switch id="memo-switch" checked={isMemoTransfer} onCheckedChange={setIsMemoTransfer} />
        </div>
        
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient's Account Number</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="10-digit account number" {...field} onChange={(e) => {
                      setRecipientName(null);
                      setVerificationError(null);
                      field.onChange(e);
                  }} />
                </FormControl>
                <Button type="button" onClick={handleVerifyAccount} disabled={isVerifying} className="w-28">
                    {isVerifying ? <Loader2 className="animate-spin" /> : "Verify"}
                </Button>
              </div>
               {recipientName && (
                  <div className="text-green-600 bg-green-500/10 p-2 rounded-md text-sm font-semibold">
                      {recipientName}
                  </div>
              )}
              {verificationError && (
                  <p className="text-sm font-medium text-destructive">{verificationError}</p>
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
                <Input type="number" placeholder="e.g., 5000" {...field} value={field.value ?? ''} />
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
                        <Textarea placeholder="e.g., Happy Birthday!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        )}
       
        <Button type="submit" className="w-full !mt-6" disabled={!recipientName}>
          Continue
        </Button>
      </form>
    </Form>
  );
}
