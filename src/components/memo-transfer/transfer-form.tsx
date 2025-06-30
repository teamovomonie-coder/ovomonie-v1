
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
import { Upload, Share2, Wallet, Loader2, ArrowLeft, Landmark, Info, Check, ChevronsUpDown, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nigerianBanks } from '@/lib/banks';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  bankCode: z.string().min(1, 'Please select a bank.'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  narration: z.string().max(50, "Narration can't exceed 50 characters.").optional(),
  message: z.string().max(300, 'Message cannot exceed 300 characters.').optional(),
  photo: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

const memoBanks = [
    { name: "Ovomonie", code: "000" },
    ...nigerianBanks,
];

const topBankCodes = ["000", "058", "044", "057", "011", "033"];
const topBanks = memoBanks.filter(b => topBankCodes.includes(b.code));
const otherBanks = memoBanks.filter(b => !topBankCodes.includes(b.code));

function MemoReceipt({ data, recipientName, onReset }: { data: FormData; recipientName: string; onReset: () => void }) {
  const { toast } = useToast();
  const bankName = memoBanks.find(b => b.code === data.bankCode)?.name || 'Unknown Bank';

  const handleShare = () => {
    toast({
      title: "Shared!",
      description: "Your memorable receipt has been shared.",
    });
  }
  
  const handleSave = () => {
      toast({
          title: "Saved!",
          description: "Your receipt has been saved to your gallery.",
      })
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-2 border-primary/20 bg-slate-50">
      <div className="bg-slate-900 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-lg font-bold">MemoTransfer Receipt</h2>
        <Wallet className="w-6 h-6" />
      </div>
      <CardContent className="p-4">
        <div className="border-2 border-blue-100 rounded-lg p-4 space-y-4 bg-white">
          {data.photo && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border">
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
            <p className="text-sm text-gray-500">{bankName}</p>
          </div>
          {data.message && (
            <blockquote className="mt-4 border-l-4 border-blue-200 pl-4 italic text-center text-gray-600 font-serif">
              "{data.message}"
            </blockquote>
          )}
           <div className="border-t pt-4 mt-4 text-xs text-gray-500 space-y-2">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Ref ID:</span>
              <span>OVO-MEMO-{Date.now()}</span>
            </div>
          </div>
        </div>
      </CardContent>
       <CardFooter className="flex flex-col gap-2 p-4 pt-0">
         <div className="flex justify-center items-center gap-2 w-full text-xs text-gray-400 mb-2">
            <div className="w-1/3 h-px bg-gray-300"></div>
             🎁 Powered by Ovomonie
            <div className="w-1/3 h-px bg-gray-300"></div>
         </div>
        <div className="flex w-full gap-2">
            <Button variant="outline" className="w-full" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button variant="outline" className="w-full" onClick={handleSave}><Download className="mr-2 h-4 w-4" /> Save</Button>
        </div>
        <Button className="w-full" onClick={onReset}>
          Make Another Transfer
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TransferForm() {
  const [step, setStep] = useState<'form' | 'summary' | 'receipt'>('form');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [isBankPopoverOpen, setIsBankPopoverOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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

    if (debounceRef.current) {
        clearTimeout(debounceRef.current);
    }
    
    if (watchedAccountNumber?.length === 10 && watchedBankCode) {
        setIsVerifying(true);
        debounceRef.current = setTimeout(async () => {
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            const mockAccounts: {[key: string]: {[key: string]: string}} = {
                '000': { '0123456789': 'PAAGO DAVID', '8012345678': 'FEMI ADEBAYO' },
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
    
    return () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
    }
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

  const handleConfirmTransfer = () => {
    setStep('receipt');
  };

  const resetForm = () => {
    setStep('form');
    setSubmittedData(null);
    setPhotoPreview(null);
    setRecipientName(null);
    form.reset();
  };

  if (step === 'receipt' && submittedData && recipientName) {
    return <MemoReceipt data={submittedData} recipientName={recipientName} onReset={resetForm} />;
  }

  if (step === 'summary' && submittedData && recipientName) {
    const bankName = memoBanks.find(b => b.code === submittedData.bankCode)?.name || 'Unknown Bank';
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
            <span className="text-muted-foreground">Bank</span>
            <span className="font-semibold">{bankName}</span>
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
          {submittedData.photo && (
            <div className="space-y-2">
              <span className="text-muted-foreground">Attached Photo</span>
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <Image src={submittedData.photo as string} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="person" />
              </div>
            </div>
          )}
          {submittedData.message && (
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
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>For Testing</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Use one of these bank/account pairs for successful verification:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><b>Ovomonie (000):</b> 0123456789</li>
                <li><b>GTB (058):</b> 1234567890</li>
                <li><b>Access Bank (044):</b> 0987654321</li>
              </ul>
            </AlertDescription>
          </Alert>
          
        <FormField
          control={form.control}
          name="bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient's Bank</FormLabel>
                <Popover open={isBankPopoverOpen} onOpenChange={setIsBankPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? memoBanks.find(bank => bank.code === field.value)?.name : "Select a bank"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search for a bank..."
                        value={bankSearchQuery}
                        onValueChange={setBankSearchQuery}
                       />
                      <CommandList>
                        <CommandEmpty>No bank found.</CommandEmpty>
                        {filteredTopBanks.length > 0 && (
                          <CommandGroup heading="Top Banks">
                            {filteredTopBanks.map(bank => (
                              <CommandItem
                                key={bank.code}
                                value={bank.name}
                                onSelect={() => {
                                  setValue("bankCode", bank.code);
                                  setIsBankPopoverOpen(false);
                                  setBankSearchQuery("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                         {(filteredTopBanks.length > 0 && filteredOtherBanks.length > 0) && <CommandSeparator />}
                        {filteredOtherBanks.length > 0 && (
                           <CommandGroup heading="All Banks">
                            {filteredOtherBanks.map(bank => (
                              <CommandItem
                                key={bank.code}
                                value={bank.name}
                                onSelect={() => {
                                  setValue("bankCode", bank.code);
                                  setIsBankPopoverOpen(false);
                                  setBankSearchQuery("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <Input placeholder="e.g., For groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        
        <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Memo Details</h3>
            <FormField
              control={form.control}
              name="photo"
              render={() => (
                <FormItem>
                  <FormLabel>Add a Photo (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="absolute h-full w-full opacity-0 cursor-pointer" />
                      <label htmlFor="photo-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        {photoPreview ? (
                          <Image src={photoPreview} alt="Preview" width={100} height={100} className="object-contain h-full" data-ai-hint="person" />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto h-8 w-8" />
                            <p>Click to upload image</p>
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
                    <Textarea placeholder="e.g., Happy Birthday! Thanks for everything." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" className="w-full !mt-6" disabled={isVerifying || !recipientName}>
          Continue
        </Button>
      </form>
    </Form>
  );
}
