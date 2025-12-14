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
      vfdPayment.setLoading(true);
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
        vfdPayment.setLoading(false);
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
      vfdPayment.setLoading(false);

      if (!data.ok) {
        vfdPayment.setError(data.message || 'Payment initiation failed');
        onError?.(data.message || 'Payment failed');
        return;
      }

      // Check if OTP is required
      if (data.data?.requiresOTP || data.data?.status === 'pending_otp') {
        setPin(reference); // Store reference for OTP submission
        setIsOTPModalOpen(true);
      } else if (data.data?.status === 'success') {
        handlePaymentSuccess(cardData.amount);
      } else {
        vfdPayment.setError(data.data?.message || 'Unknown payment status');
      }
    } catch (err) {
      vfdPayment.setLoading(false);
      const message = err instanceof Error ? err.message : 'Payment failed';
      vfdPayment.setError(message);
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

      vfdPayment.setLoading(true);
      const res = await fetch('/api/vfd/cards/authorize-otp', {
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
      vfdPayment.setLoading(false);

      if (!data.ok) {
        vfdPayment.setError(data.message || 'OTP validation failed');
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
      vfdPayment.setLoading(false);
      const message = err instanceof Error ? err.message : 'OTP validation failed';
      vfdPayment.setError(message);
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
          {vfdPayment.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{vfdPayment.error}</AlertDescription>
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
                    disabled={vfdPayment.isLoading}
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
                    disabled={vfdPayment.isLoading}
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
                      disabled={vfdPayment.isLoading}
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
                      disabled={vfdPayment.isLoading}
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
                    disabled={vfdPayment.isLoading}
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
            disabled={vfdPayment.isLoading}
          >
            {vfdPayment.isLoading ? (
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
        isProcessing={vfdPayment.isLoading}
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
