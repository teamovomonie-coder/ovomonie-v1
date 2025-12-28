'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { ArrowLeft, Loader2, Wallet, User, Hash } from 'lucide-react';
import Link from 'next/link';

export default function ScanQRPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [qrData, setQrData] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    accountNumber?: string;
    accountName?: string;
    amount?: number;
  } | null>(null);

  // Auto-parse if data is in URL
  useEffect(() => {
    const urlData = searchParams.get('data');
    if (urlData) {
      try {
        const decoded = decodeURIComponent(urlData);
        const data = JSON.parse(decoded);
        
        if (data.type === 'ovomonie-funding') {
          setParsedData({
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            amount: data.amount
          });
          
          if (data.amount) {
            setAmount(data.amount.toString());
          }
        }
      } catch (error) {
        console.error('Error parsing URL data:', error);
      }
    }
  }, [searchParams]);

  const handleParse = () => {
    try {
      const data = JSON.parse(qrData);
      
      if (data.type !== 'ovomonie-funding') {
        throw new Error('Invalid QR code format');
      }

      setParsedData({
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        amount: data.amount
      });

      if (data.amount) {
        setAmount(data.amount.toString());
      }

      toast({
        title: 'QR Code Scanned',
        description: `Ready to fund ${data.accountName}'s wallet`
      });
    } catch (error) {
      toast({
        title: 'Invalid QR Code',
        description: 'Please scan a valid Ovomonie funding QR code',
        variant: 'destructive'
      });
    }
  };

  const handleFund = async () => {
    if (!parsedData || !amount || parseFloat(amount) < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter an amount of at least ₦100',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      const response = await fetch('/api/transfers/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientAccountNumber: parsedData.accountNumber,
          amount: parseFloat(amount),
          narration: 'QR Code Payment'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Transfer failed');
      }

      toast({
        title: 'Transfer Successful',
        description: `₦${parseFloat(amount).toLocaleString()} sent to ${parsedData.accountName}`
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Scan QR Code</h1>
        </div>

        {!parsedData ? (
          <Card>
            <CardHeader>
              <CardTitle>Scan Payment QR</CardTitle>
              <CardDescription>
                Paste the QR code data to view payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="qrData">QR Code Data</Label>
                <Input
                  id="qrData"
                  placeholder="Paste QR code data here"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                />
              </div>

              <Button onClick={handleParse} className="w-full" disabled={!qrData}>
                Parse QR Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Ovomonie Branding */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Ovomonie</h2>
              <p className="text-sm text-muted-foreground">Secure Payment Request</p>
            </div>

            {/* Payment Details Card */}
            <Card className="border-2">
              <CardContent className="p-6 space-y-6">
                {/* Recipient Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Recipient</p>
                      <p className="font-semibold text-lg">{parsedData.accountName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Hash className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-mono font-semibold">{parsedData.accountNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Section */}
                {parsedData.amount ? (
                  <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                    <p className="text-xs text-muted-foreground text-center mb-1">Amount Requested</p>
                    <p className="text-4xl font-bold text-center text-primary">₦{parsedData.amount.toLocaleString()}</p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="amount">Enter Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="100"
                      className="text-lg h-12"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleFund} 
                className="w-full h-12 text-lg" 
                disabled={isProcessing || !amount}
                size="lg"
              >
                {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isProcessing ? 'Processing...' : `Pay ₦${amount ? parseFloat(amount).toLocaleString() : '0'}`}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setParsedData(null);
                  setQrData('');
                  setAmount('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
