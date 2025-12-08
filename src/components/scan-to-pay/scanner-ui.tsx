
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QrCode, ArrowLeft, CheckCircle, Loader2, VideoOff, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { Separator } from '../ui/separator';

type View = 'scan' | 'confirm' | 'success';

const mockScannedData = {
  recipientName: "John Smith",
  accountNumber: "0987654321", // This is a valid mock account number
  amount: 2500,
  narration: "Payment for coffee and snacks",
};

interface TransactionDetails {
  recipientName: string;
  accountNumber: string;
  amount: number;
  narration: string;
}

export function ScannerUI() {
  const [view, setView] = useState<View>('scan');
  const [scannedData, setScannedData] = useState<TransactionDetails | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);

  useEffect(() => {
    if (view !== 'scan') {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        return;
    };

    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in browser settings.' });
      }
    };
    getCameraPermission();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [view, toast]);

  const handleSimulateScan = () => {
    setScannedData(mockScannedData);
    setView('confirm');
  };

   const handlePaymentRequest = () => {
    if (!scannedData || balance === null || scannedData.amount * 100 > balance) {
        toast({
            variant: 'destructive',
            title: 'Insufficient Funds',
            description: 'Your wallet balance is not enough for this transaction.'
        });
        return;
    }
    setIsPinModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!scannedData) return;
    
    setIsProcessing(true);
    setApiError(null);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const clientReference = `scan-pay-${crypto.randomUUID()}`;

        const response = await fetch('/api/transfers/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                recipientAccountNumber: scannedData.accountNumber,
                amount: scannedData.amount,
                narration: scannedData.narration,
                clientReference,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Payment failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.data.newSenderBalance);
        addNotification({
            title: 'Payment Successful!',
            description: `You sent ₦${scannedData.amount.toLocaleString()} to ${scannedData.recipientName}.`,
            category: 'transaction',
        });
        setTransactionReference(result.data.reference);
        toast({ title: 'Payment Successful!' });
        setView('success');

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


  const resetScanner = () => {
    setView('scan');
    setScannedData(null);
    setTransactionReference(null);
  };

  if (view === 'success') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
          <CardTitle className="text-2xl mt-4">Payment Successful!</CardTitle>
          <CardDescription>
            You sent ₦{scannedData?.amount.toLocaleString()} to {scannedData?.recipientName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
             <div className="flex justify-between"><span>Reference ID</span><span className="font-mono">{transactionReference}</span></div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={resetScanner} className="w-full">Done</Button>
        </CardFooter>
      </Card>
    );
  }

  if (view === 'confirm' && scannedData) {
    return (
        <>
            <Card className="w-full max-w-md">
                <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={resetScanner}><ArrowLeft/></Button>
                    <CardTitle>Confirm Payment</CardTitle>
                </div>
                <CardDescription>Review the details before you pay.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">You are paying</p>
                        <p className="text-2xl font-bold">{scannedData.recipientName}</p>
                        <p className="text-sm text-muted-foreground">Ovomonie Account: {scannedData.accountNumber}</p>
                    </div>
                     <Separator />
                    <div className="flex justify-between items-end">
                        <span className="text-lg text-muted-foreground">Amount</span>
                        <span className="text-3xl font-bold">₦{scannedData.amount.toLocaleString()}</span>
                    </div>
                    {scannedData.narration && (
                        <div className="text-sm">
                            <span className="text-muted-foreground">For: </span>
                            <span className="font-semibold">{scannedData.narration}</span>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                <Button onClick={handlePaymentRequest} className="w-full">Pay Now</Button>
                </CardFooter>
            </Card>
             <PinModal
                open={isPinModalOpen}
                onOpenChange={setIsPinModalOpen}
                onConfirm={handleConfirmPayment}
                isProcessing={isProcessing}
                error={apiError}
                onClearError={() => setApiError(null)}
                title="Authorize Payment"
            />
      </>
    );
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Scan to Pay</CardTitle>
        <CardDescription>Position the merchant's QR code inside the frame.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square mx-auto bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute top-4 left-4 border-t-4 border-l-4 border-primary w-12 h-12 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 border-t-4 border-r-4 border-primary w-12 h-12 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 border-b-4 border-l-4 border-primary w-12 h-12 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 border-b-4 border-r-4 border-primary w-12 h-12 rounded-br-lg"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite]" />
          </div>
           {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20 p-4">
                    <VideoOff className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-bold">Camera Access Required</h3>
                    <p className="text-sm mt-2">Please allow camera access to scan QR codes.</p>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSimulateScan} className="w-full" disabled={hasCameraPermission === false}>
          Simulate Scan
        </Button>
      </CardFooter>
      <style jsx>{`
        @keyframes scan {
            0%, 100% { transform: translateY(-120px); }
            50% { transform: translateY(120px); }
        }
      `}</style>
    </Card>
  );
}
