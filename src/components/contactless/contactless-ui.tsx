"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Nfc, CheckCircle, XCircle, Share2, Download, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

declare global {
    interface Window {
        NFCReader: any;
    }
}

function NfcPay() {
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
    const [paymentStep, setPaymentStep] = useState<'idle' | 'ready' | 'success'>('idle');

    useEffect(() => {
        // Simulate checking for NFC support after component mounts
        setNfcSupported('NFCReader' in window);
    }, []);

    if (nfcSupported === null) {
        return <div className="text-center p-8">Checking for NFC support...</div>;
    }

    if (!nfcSupported) {
        return (
             <Alert variant="destructive" className="m-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>NFC Not Supported</AlertTitle>
                <AlertDescription>
                   Your device does not support NFC, or it is not enabled.
                </AlertDescription>
            </Alert>
        );
    }
    
    if (paymentStep === 'success') {
        return (
             <div className="text-center space-y-4 p-8 flex flex-col items-center">
                <CheckCircle className="w-24 h-24 text-green-500" />
                <h3 className="text-2xl font-bold">Payment Successful</h3>
                <p>You have successfully paid with NFC.</p>
                <Button onClick={() => setPaymentStep('idle')}>Make Another Payment</Button>
            </div>
        )
    }

    if (paymentStep === 'ready') {
        return (
             <div className="text-center space-y-4 p-8 flex flex-col items-center">
                <div className="relative w-32 h-32">
                    <Nfc className="w-32 h-32 text-primary" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping"></div>
                </div>
                <h3 className="text-2xl font-bold">Ready to Pay</h3>
                <p className="text-muted-foreground">Tap your phone on the terminal.</p>
                <Button variant="outline" onClick={() => setTimeout(() => setPaymentStep('success'), 1000)}>Simulate Tap</Button>
            </div>
        )
    }

    return (
        <div className="text-center space-y-4 p-8">
            <Nfc className="w-16 h-16 mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Tap to Pay</h3>
            <p className="text-muted-foreground">Pay securely by tapping your phone on an NFC-enabled POS terminal.</p>
            <Button onClick={() => setPaymentStep('ready')} size="lg">Activate NFC Payment</Button>
        </div>
    );
}


function QrPay() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const getCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
        };
        getCameraPermission();
        
        return () => {
             if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [toast]);

    const handleScan = () => setScanned(true);
    const handleReset = () => setScanned(false);

    return (
         <div className="space-y-4 p-4">
             <div className="relative w-full aspect-square mx-auto bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center max-w-sm">
                {scanned ? (
                    <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white z-10">
                        <CheckCircle className="w-24 h-24" />
                        <p className="text-xl font-bold mt-2">Paid!</p>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute top-4 left-4 border-t-4 border-l-4 border-primary w-12 h-12 rounded-tl-lg"></div>
                            <div className="absolute top-4 right-4 border-t-4 border-r-4 border-primary w-12 h-12 rounded-tr-lg"></div>
                            <div className="absolute bottom-4 left-4 border-b-4 border-l-4 border-primary w-12 h-12 rounded-bl-lg"></div>
                            <div className="absolute bottom-4 right-4 border-b-4 border-r-4 border-primary w-12 h-12 rounded-br-lg"></div>
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite]"></div>
                        </div>
                    </>
                )}
                 {hasCameraPermission === false && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
                        <VideoOff className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-bold">Camera Access Denied</h3>
                        <p className="text-sm text-center max-w-xs mt-2">To scan QR codes, please allow camera access in your browser settings.</p>
                    </div>
                )}
            </div>
            {scanned ? (
                 <Button onClick={handleReset} className="w-full">Scan Another Code</Button>
            ) : (
                 <Button onClick={handleScan} className="w-full" disabled={hasCameraPermission === false}>Simulate Scan</Button>
            )}
            <style jsx>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(-120px); }
                    50% { transform: translateY(120px); }
                }
            `}</style>
         </div>
    );
}

function Receive() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: `${action}!`,
      description: `Your QR code has been ${action.toLowerCase()}.`
    });
  }

  return (
    <div className="text-center space-y-4 p-4">
      <div className="bg-white p-4 inline-block rounded-lg border shadow-sm">
        <Image 
          src="https://placehold.co/256x256.png"
          alt="Your QR Code"
          width={256}
          height={256}
          data-ai-hint="qr code"
        />
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg">PAAGO DAVID</p>
        <p className="text-muted-foreground font-mono">8012345678</p>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Show this QR code to a merchant or another user to receive money instantly.
      </p>
      <div className="flex gap-2 justify-center pt-2">
        <Button onClick={() => handleAction('Shared')} variant="outline">
          <Share2 className="mr-2" /> Share
        </Button>
        <Button onClick={() => handleAction('Saved')}>
          <Download className="mr-2" /> Save
        </Button>
      </div>
    </div>
  );
}


export function ContactlessUI() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Contactless Banking</CardTitle>
        <CardDescription>
          Pay and receive money quickly and securely without physical contact.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="pay" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pay">Pay</TabsTrigger>
            <TabsTrigger value="receive">Receive</TabsTrigger>
          </TabsList>
          <TabsContent value="pay">
             <Tabs defaultValue="qr" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mt-4">
                    <TabsTrigger value="qr"><QrCode className="mr-2" /> Scan QR</TabsTrigger>
                    <TabsTrigger value="nfc"><Nfc className="mr-2" /> Tap & Pay</TabsTrigger>
                </TabsList>
                <TabsContent value="qr" className="mt-0">
                    <QrPay />
                </TabsContent>
                <TabsContent value="nfc" className="mt-0">
                    <NfcPay />
                </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="receive" className="mt-0">
            <Receive />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
