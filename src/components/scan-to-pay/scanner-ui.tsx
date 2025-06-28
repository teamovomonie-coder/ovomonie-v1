"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, CheckCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScannerUI() {
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    setScanned(true);
  };

  const handleReset = () => {
    setScanned(false);
  };
  
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Scan to Pay</CardTitle>
        <CardDescription>
          {scanned
            ? "Payment successful!"
            : "Position the QR code within the frame to pay."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-64 h-64 mx-auto bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            <div className={cn("absolute inset-0 transition-opacity", scanned ? "opacity-100" : "opacity-0")}>
                <div className="w-full h-full bg-green-500/80 flex flex-col items-center justify-center text-white">
                    <CheckCircle className="w-24 h-24" />
                    <p className="text-xl font-bold mt-2">Paid!</p>
                </div>
            </div>

            <div className={cn("absolute inset-0 transition-opacity", scanned ? "opacity-0" : "opacity-100")}>
                <QrCode className="w-32 h-32 text-gray-500" />
                <div className="absolute top-0 left-0 border-t-4 border-l-4 border-primary w-12 h-12 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 border-t-4 border-r-4 border-primary w-12 h-12 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 border-b-4 border-l-4 border-primary w-12 h-12 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 border-b-4 border-r-4 border-primary w-12 h-12 rounded-br-lg"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        {scanned ? (
          <Button onClick={handleReset} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Scan Another
          </Button>
        ) : (
          <Button onClick={handleScan} className="w-full">
            Simulate Scan
          </Button>
        )}
      </CardFooter>
      <style jsx>{`
        @keyframes scan {
            0%, 100% { transform: translateY(-100px); }
            50% { transform: translateY(100px); }
        }
      `}</style>
    </Card>
  );
}
