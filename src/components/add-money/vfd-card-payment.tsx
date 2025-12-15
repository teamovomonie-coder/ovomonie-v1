/**
 * Enhanced VFD Card Payment Component
 * Uses the unified VFD payment system with OTP support
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useVFDPayment, type PaymentInitRequest } from '@/hooks/use-vfd-payment';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const cardSchema = z.object({
  amount: z.number().min(1000, 'Amount must be at least ₦1000'),
  cardNumber: z.string().min(13, 'Invalid card number'),
  expiry: z.string(),
  cvv: z.string().min(3, 'CVV must be at least 3 digits'),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

// Convert expiry to VFD format YYMM
function convertToYYMM(expiry: string): string {
  if (expiry.length === 4 && !expiry.includes('/')) {
    // Already in YYMM format (e.g., 5003)
    return expiry;
  }
  // Convert MM/YY to YYMM
  const [mm, yy] = expiry.split('/');
  return `${yy}${mm}`;
}

type CardFormData = z.infer<typeof cardSchema>;

interface ExtendedCardData extends CardFormData {
  actualPin?: string; // From PIN modal
}

interface VFDCardPaymentProps {
  onSuccess?: (amount: number) => void;
  onError?: (error: string) => void;
}

export function VFDCardPayment({ onSuccess, onError }: VFDCardPaymentProps) {
  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const vfdPayment = useVFDPayment();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [cardData, setCardData] = useState<CardFormData | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Poll payment status after 3D Secure redirect
  const pollPaymentStatus = async (reference: string, amount: number) => {
    setIsPolling(true);
    const token = localStorage.getItem('ovo-auth-token');
    const maxAttempts = 30; // Poll for up to 5 minutes (10s intervals)
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
      
      try {
        const res = await fetch(`/api/vfd/cards/status?reference=${encodeURIComponent(reference)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (data.ok && data.data?.status === '00') {
          setIsPolling(false);
          handlePaymentSuccess(amount);
          return;
        } else if (data.data?.status && data.data.status !== '00' && data.data.status !== 'pending') {
          setIsPolling(false);
          setProcessingError(data.data?.message || 'Payment failed');
          return;
        }
      } catch (err) {
        // Continue polling on error
      }
    }
    
    setIsPolling(false);
    toast({
      title: 'Payment Status Unknown',
      description: 'Please check your transaction history for the payment status.',
      variant: 'destructive',
    });
  };

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      amount: 0,
      cardNumber: '',
      expiry: '',
      cvv: '',
      pin: '',
    },
  });

  const onSubmit = async (data: CardFormData) => {
    setCardData(data);
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = async (inputPin?: string) => {
    if (!cardData) {
      toast({
        title: 'Error',
        description: 'Card data is missing',
        variant: 'destructive',
      });
      return;
    }

    const cardPin = cardData.pin;
    if (!cardPin) {
      toast({
        title: 'Error',
        description: 'Card PIN is required',
        variant: 'destructive',
      });
      return;
    }

    // Verify the user's account PIN first
    if (!inputPin) {
      toast({
        title: 'Error',
        description: 'Please enter your authorization PIN',
        variant: 'destructive',
      });
      return;
    }

    setIsPinModalOpen(false);

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please login to continue',
          variant: 'destructive',
        });
        return;
      }

      // Verify account PIN
      setIsProcessing(true);
      setProcessingError(null);
      const pinVerifyRes = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin: inputPin }),
      });

      const pinVerifyData = await pinVerifyRes.json();
      
      if (!pinVerifyData.valid) {
        setIsProcessing(false);
        toast({
          title: 'Error',
          description: 'Incorrect authorization PIN',
          variant: 'destructive',
        });
        return;
      }

      const reference = `ovopay-${Date.now()}`;
      const expiryYYMM = convertToYYMM(cardData.expiry);

      const res = await fetch('/api/vfd/cards/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardNumber: cardData.cardNumber.replace(/\s+/g, ''),
          expiryDate: expiryYYMM,
          cvv: cardData.cvv,
          cardPin,
          amount: cardData.amount,
          currency: 'NGN',
          reference,
        }),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (!data.ok) {
        setProcessingError(data.message || 'Payment initiation failed');
        onError?.(data.message || 'Payment failed');
        return;
      }

      // Handle VFD API responses
      const responseData = data.data?.data || data.data;
      
      // Check if redirect is required (3D Secure / Mastercard authentication)
      if (responseData?.redirectHtml) {
        // Open redirect URL in a new window for 3D Secure authentication
        window.open(responseData.redirectHtml, '_blank', 'width=500,height=600');
        toast({
          title: 'Complete Authentication',
          description: 'Please complete the card authentication in the opened window.',
        });
        // Start polling for payment status
        pollPaymentStatus(reference, cardData.amount);
        return;
      }
      
      // Check if OTP is required (code "01" means OTP needed)
      if (responseData?.code === '01' || 
          responseData?.narration?.toLowerCase().includes('otp') ||
          data.data?.requiresOTP || 
          data.data?.status === 'pending_otp') {
        setPin(reference); // Store reference for OTP submission
        setIsOTPModalOpen(true);
        toast({
          title: 'OTP Required',
          description: 'Please enter the OTP sent to your phone.',
        });
      } else if (responseData?.code === '00' || data.data?.status === 'success') {
        handlePaymentSuccess(cardData.amount);
      } else {
        // For other codes, show the message
        const msg = responseData?.narration || responseData?.message || data.data?.message || 'Payment processing';
        toast({
          title: 'Processing',
          description: msg,
        });
      }
    } catch (err) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'Payment failed';
      setProcessingError(message);
      onError?.(message);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: 'Error',
        description: 'Please enter a valid OTP',
        variant: 'destructive',
      });
      return;
    }

    if (!pin) {
      toast({
        title: 'Error',
        description: 'Payment reference is missing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please login to continue',
          variant: 'destructive',
        });
        return;
      }

      setIsProcessing(true);
      setProcessingError(null);
      const res = await fetch('/api/vfd/cards/validate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: pin,
          otp,
        }),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (!data.ok) {
        setProcessingError(data.message || 'OTP validation failed');
        toast({
          title: 'Error',
          description: data.message || 'OTP validation failed',
          variant: 'destructive',
        });
        return;
      }

      setIsOTPModalOpen(false);
      if (cardData) {
        handlePaymentSuccess(cardData.amount);
      }
    } catch (err) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'OTP validation failed';
      setProcessingError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = (amount: number) => {
    addNotification({
      title: 'Wallet Funded',
      description: `You successfully added ₦${amount.toLocaleString()} to your wallet via card.`,
      category: 'transaction',
    });

    toast({
      title: 'Success',
      description: 'Payment completed successfully',
    });

    onSuccess?.(amount);
    vfdPayment.resetState();
    form.reset();
    setCardData(null);
    setOtp('');
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {processingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{processingError}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    {...field}
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    disabled={isProcessing || vfdPayment.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    {...field}
                    disabled={isProcessing || vfdPayment.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="expiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="YYMM (e.g., 5003) or MM/YY"
                      {...field}
                      disabled={isProcessing || vfdPayment.isLoading}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">VFD format: 5003 = March 2050</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cvv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="111"
                      maxLength={4}
                      {...field}
                      disabled={isProcessing || vfdPayment.isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card PIN</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="1111"
                    maxLength={4}
                    {...field}
                    disabled={isProcessing || vfdPayment.isLoading}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">4-digit card PIN</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing || vfdPayment.isLoading}
          >
            {isProcessing || vfdPayment.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Fund Wallet'
            )}
          </Button>
        </form>
      </Form>

      {/* PIN Modal */}
      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handlePinConfirm}
        isProcessing={isProcessing || vfdPayment.isLoading}
        title="Authorize Card Deposit"
        description="Enter your 4-digit PIN to authorize this card deposit"
      />

      {/* OTP Modal */}
      <Dialog open={isOTPModalOpen} onOpenChange={setIsOTPModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>
              We've sent a One-Time Password to your registered phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <FormLabel>One-Time Password</FormLabel>
              <Input
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={vfdPayment.isValidatingOTP}
                className="mt-2 text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              onClick={handleOTPSubmit}
              className="w-full"
              disabled={vfdPayment.isValidatingOTP || otp.length < 4}
            >
              {vfdPayment.isValidatingOTP ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsOTPModalOpen(false)}
              disabled={vfdPayment.isValidatingOTP}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VFDCardPayment;
