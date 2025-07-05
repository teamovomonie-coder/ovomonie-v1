
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Nfc, Camera, ArrowLeft, Download, Share2, CheckCircle, Loader2, Info, Timer, VideoOff, Wallet, RadioTower } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { AnimatePresence, motion } from 'framer-motion';

declare global {
  interface Window {
    NDEFReader: any;
  }
}

type View = 'main' | 'generate' | 'display_qr' | 'scan_qr' | 'confirm_payment' | 'receipt';

const GenerateSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least ₦1.'),
  memo: z.string().max(50, 'Memo cannot exceed 50 characters.').optional(),
});
type GenerateFormData = z.infer<typeof GenerateSchema>;

interface TransactionData {
  type: 'sent' | 'received';
  amount: number;
  peer: string;
  memo?: string;
  ref: string;
  accountNumber: string;
}

function MainScreen({ setView, onNfcPay, isNfcSupported, nfcStatus }: { setView: (view: View) => void; onNfcPay: () => void; isNfcSupported: boolean; nfcStatus: string; }) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-none border-none text-center">
      <CardHeader>
        <CardTitle>Tap to Pay</CardTitle>
        <CardDescription>Hold your phone near a contactless terminal to pay.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-8 py-10">
        <button
          className="relative flex items-center justify-center w-48 h-48 rounded-full disabled:opacity-50 group"
          onClick={onNfcPay}
          disabled={!isNfcSupported || nfcStatus !== 'idle'}
          aria-label="Tap to Pay"
        >
          <div className="absolute h-48 w-48 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-primary/10 group-disabled:animate-none"></div>
          <div className="absolute h-32 w-32 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-primary/20" style={{ animationDelay: '0.5s' }}></div>
          <div className="relative flex items-center justify-center w-24 h-24 bg-primary text-primary-foreground rounded-full transition-transform group-hover:scale-110">
            <Nfc className="w-12 h-12" />
          </div>
        </button>
        <AnimatePresence mode="wait">
        <motion.p 
            key={nfcStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-muted-foreground font-semibold h-5"
        >
            {nfcStatus === 'scanning' ? "Ready to Scan. Hold near terminal..." :
             nfcStatus === 'error' ? "NFC Not Supported or Enabled" :
             "Your Ovomonie wallet is ready."}
        </motion.p>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setView('scan_qr')} className="h-16 flex-col gap-1">
          <QrCode className="w-6 h-6" />
          Scan QR
        </Button>
        <Button variant="outline" onClick={() => setView('generate')} className="h-16 flex-col gap-1">
          <Wallet className="w-6 h-6" />
          Receive Money
        </Button>
      </CardFooter>
    </Card>
  );
}

function GenerateScreen({ setView, setTransactionData }: { setView: (view: View) => void, setTransactionData: (data: any) => void }) {
  const { user } = useAuth();
  const form = useForm<GenerateFormData>({
    resolver: zodResolver(GenerateSchema),
    defaultValues: { amount: 0, memo: '' }
  });

  function onSubmit(data: GenerateFormData) {
    const payload = {
      accountNumber: user?.accountNumber,
      amount: data.amount,
      memo: data.memo,
      peer: user?.fullName,
      ref: `OVO-RCV-${Date.now()}`
    };
    setTransactionData(payload);
    setView('display_qr');
  }

  return (
    <Card className="w-full max-w-md mx-auto">
       <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setView('main')}><ArrowLeft/></Button>
          <CardTitle>Receive Money</CardTitle>
        </div>
        <CardDescription>Enter an amount to generate a payment QR code.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₦)</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value === 0 ? '' : field.value} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="memo" render={({ field }) => (
              <FormItem>
                <FormLabel>Memo / Reason (Optional)</FormLabel>
                <FormControl><Textarea placeholder="e.g., For lunch" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full">Generate Code</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function DisplayQrScreen({ setView, transactionData, isNfcSupported }: { setView: (view: View) => void, transactionData: any, isNfcSupported: boolean }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [nfcWriteStatus, setNfcWriteStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    if (timeLeft === 0) {
      setView('main');
      toast({ variant: 'destructive', title: 'QR Code Expired', description: 'Please generate a new code.' });
      return;
    }
    const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, setView, toast]);

  const handleNfcWrite = async () => {
    if (!isNfcSupported) {
        toast({ variant: 'destructive', title: 'NFC Not Supported' });
        return;
    }
    try {
        setNfcWriteStatus('writing');
        const ndef = new window.NDEFReader();
        await ndef.write({
            records: [{ recordType: "text", data: JSON.stringify(transactionData) }]
        });
        setNfcWriteStatus('success');
        toast({ title: 'Success!', description: 'Payment details written to device.' });
    } catch (error) {
        setNfcWriteStatus('error');
        console.error("NFC write error:", error);
        toast({ variant: 'destructive', title: 'NFC Write Failed', description: 'Could not write to the device. Please try again.' });
    } finally {
        setTimeout(() => setNfcWriteStatus('idle'), 2000);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const qrText = encodeURIComponent(JSON.stringify({ ref: transactionData.ref }));

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <CardHeader>
        <CardTitle>Scan to Receive Payment</CardTitle>
        <CardDescription>Ask the sender to scan this code.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 inline-block rounded-lg border shadow-sm">
          <Image src={`https://placehold.co/256x256.png?text=${qrText}`} alt="Generated QR Code" width={256} height={256} data-ai-hint="qr code" />
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Amount</p>
          <p className="text-3xl font-bold">₦{transactionData.amount.toLocaleString()}</p>
          {transactionData.memo && <p className="text-muted-foreground mt-1">For: {transactionData.memo}</p>}
        </div>
        <div className="flex items-center gap-2 font-mono text-destructive p-2 bg-destructive/10 rounded-md">
            <Timer className="w-5 h-5" />
            <span>Code expires in: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
         {isNfcSupported && (
             <Button onClick={handleNfcWrite} className="w-full" disabled={nfcWriteStatus !== 'idle'}>
                {nfcWriteStatus === 'writing' && <><Loader2 className="animate-spin mr-2"/>Hold near device...</>}
                {nfcWriteStatus === 'success' && <><CheckCircle className="mr-2"/>Written!</>}
                {nfcWriteStatus === 'error' && <><XCircle className="mr-2"/>Failed</>}
                {nfcWriteStatus === 'idle' && <><RadioTower className="mr-2"/>Write to NFC</>}
             </Button>
         )}
        <Button onClick={() => setView('main')} className="w-full" variant="outline">Done</Button>
      </CardFooter>
    </Card>
  )
}

function ScanQrScreen({ setView, setTransactionData }: { setView: (view: View) => void, setTransactionData: (data: any) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied' });
      }
    };
    getCameraPermission();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  const handleSimulateScan = () => {
    setTransactionData({
      peer: 'The Coffee Shop',
      amount: 4500,
      memo: 'Morning Latte',
      accountNumber: '8765432109',
      ref: `OVO-TXN-${Date.now()}`
    });
    setView('confirm_payment');
  }

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setView('main')}><ArrowLeft/></Button>
            <CardTitle>Scan to Pay</CardTitle>
        </div>
        <CardDescription>Position the QR code inside the frame.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square mx-auto bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute inset-0 border-8 border-black/50" />
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite]" />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20 p-4">
                    <VideoOff className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-bold">Camera Access Required</h3>
                </div>
            )}
        </div>
      </CardContent>
       <CardFooter>
          <Button onClick={handleSimulateScan} className="w-full" disabled={hasCameraPermission === false}>Simulate Scan</Button>
      </CardFooter>
       <style jsx>{`
            @keyframes scan { 0%, 100% { transform: translateY(-120px); } 50% { transform: translateY(120px); } }
        `}</style>
    </Card>
  )
}

function ConfirmPaymentScreen({ onConfirm, isProcessing, reset, transactionData }: { onConfirm: () => void, isProcessing: boolean, reset: () => void, transactionData: any }) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Confirm Payment</CardTitle>
                <CardDescription>Review the details before you confirm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center space-y-1 p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">You are paying</p>
                    <p className="text-lg font-semibold">{transactionData.peer}</p>
                </div>
                <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold">₦{transactionData.amount.toLocaleString()}</span>
                </div>
                {transactionData.memo && <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">For:</span>
                    <span className="font-semibold">{transactionData.memo}</span>
                </div>}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={reset} disabled={isProcessing}>Cancel</Button>
                <Button onClick={onConfirm} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Pay Now'}
                </Button>
            </CardFooter>
        </Card>
    );
}

function ReceiptScreen({ transactionData, reset }: { transactionData: any, reset: () => void }) {
    const { toast } = useToast();
    const handleAction = (action: string) => {
        toast({ title: `${action}!`, description: `Your receipt has been ${action.toLowerCase()}.` });
    };

    return (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>You sent ₦{transactionData.amount.toLocaleString()} to {transactionData.peer}.</CardDescription>
            </CardHeader>
            <CardContent className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm text-left">
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">₦{transactionData.amount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-medium">{transactionData.peer}</span></div>
                {transactionData.memo && <div className="flex justify-between"><span className="text-muted-foreground">Memo</span><span className="font-medium">{transactionData.memo}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date().toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-medium font-mono text-xs">{transactionData.ref}</span></div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-4">
                 <div className="flex w-full gap-2">
                    <Button onClick={() => handleAction('Shared')} variant="outline" className="w-full">
                        <Share2 className="mr-2" /> Share
                    </Button>
                    <Button onClick={() => handleAction('Saved')} className="w-full">
                        <Download className="mr-2" /> Save
                    </Button>
                </div>
                <Button variant="ghost" onClick={reset} className="w-full">Done</Button>
            </CardFooter>
        </Card>
    )
}

export function ContactlessUI() {
  const [view, setView] = useState<View>('main');
  const [transactionData, setTransactionData] = useState<any>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'scanning' | 'error'>('idle');
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsNfcSupported(true);
    } else {
      setIsNfcSupported(false);
      setNfcStatus('error');
    }
  }, []);

  const reset = () => {
    setView('main');
    setTransactionData(null);
    setApiError(null);
  }

  const handleNfcPay = async () => {
    if (!isNfcSupported) {
      toast({ variant: 'destructive', title: 'NFC not supported on this device.' });
      return;
    }

    try {
      setNfcStatus('scanning');
      const ndef = new window.NDEFReader();
      await ndef.scan();

      ndef.addEventListener("reading", ({ message }: { message: any }) => {
        const decoder = new TextDecoder();
        const decodedRecord = decoder.decode(message.records[0].data);
        const data = JSON.parse(decodedRecord);
        
        // Add a peer name for display if missing
        if (!data.peer) data.peer = "Contactless Merchant";

        setTransactionData(data);
        setView('confirm_payment');
        setNfcStatus('idle');
      });

    } catch (error) {
      console.error(`NFC Error: ${error}`);
      setNfcStatus('error');
      toast({ variant: 'destructive', title: 'NFC Scan Failed', description: 'Could not start scanning. Please ensure NFC is enabled.' });
    }
  }

  const handlePaymentRequest = () => {
    if (!transactionData || balance === null || transactionData.amount * 100 > balance) {
      toast({ variant: 'destructive', title: 'Insufficient Funds' });
      return;
    }
    setIsPinModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!transactionData || balance === null) return;
    setIsProcessing(true);
    setApiError(null);

    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const response = await fetch('/api/transfers/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ recipientAccountNumber: transactionData.accountNumber, amount: transactionData.amount, narration: transactionData.memo }),
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Payment failed.');
            error.response = response; 
            throw error;
        }
        
        updateBalance(result.data.newSenderBalance);
        addNotification({ title: 'Contactless Payment Successful', description: `You paid ₦${transactionData.amount.toLocaleString()} to ${transactionData.peer}.`, category: 'transaction' });
        setTransactionData((prev: any) => ({...prev, ref: result.data.reference}));
        toast({ title: 'Payment Successful!' });
        setView('receipt');

    } catch (error: any) {
        let description = 'An unknown error occurred.';
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            description = 'Please check your internet connection.';
        } else if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
            description = error.message;
        }
        setApiError(description);
    } finally {
        setIsProcessing(false);
        setIsPinModalOpen(false);
    }
  };


  const renderContent = () => {
    switch (view) {
      case 'generate':
        return <GenerateScreen setView={setView} setTransactionData={setTransactionData} />;
      case 'display_qr':
        return <DisplayQrScreen setView={setView} transactionData={transactionData} isNfcSupported={isNfcSupported} />;
      case 'scan_qr':
        return <ScanQrScreen setView={setView} setTransactionData={setTransactionData} />;
      case 'confirm_payment':
        return <ConfirmPaymentScreen onConfirm={handlePaymentRequest} isProcessing={isProcessing} reset={reset} transactionData={transactionData} />;
      case 'receipt':
        return <ReceiptScreen transactionData={transactionData} reset={reset} />;
      case 'main':
      default:
        return <MainScreen setView={setView} onNfcPay={handleNfcPay} isNfcSupported={isNfcSupported} nfcStatus={nfcStatus} />;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      <PinModal 
        open={isPinModalOpen} 
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmPayment}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Authorize Contactless Payment"
      />
    </div>
  );
}
