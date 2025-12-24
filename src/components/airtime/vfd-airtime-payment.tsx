/**
 * VFD Airtime Payment Component
 * Handles mobile airtime top-ups through VFD
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PinModal } from '@/components/auth/pin-modal';
import { useNotifications } from '@/context/notification-context';
import { Loader2, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import networks from './network-logos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const airtimeSchema = z.object({
  provider: z.string().min(1, 'Select a mobile provider'),
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/, 'Enter a valid 10-11 digit phone number'),
  amount: z.number().min(100, 'Minimum airtime is ₦100'),
});

type AirtimeFormData = z.infer<typeof airtimeSchema>;

const MOBILE_PROVIDERS = [
  { id: 'mtn', name: 'MTN', color: 'bg-yellow-500' },
  { id: 'airtel', name: 'Airtel', color: 'bg-red-500' },
  { id: 'glo', name: 'Globacom (GLO)', color: 'bg-green-600' },
  { id: 't2', name: 'T2', color: 'bg-purple-700' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

interface VFDAirtimePaymentProps {
  onSuccess?: (amount: number, provider: string, phone: string) => void;
  onError?: (error: string) => void;
}

export function VFDAirtimePayment({ onSuccess, onError }: VFDAirtimePaymentProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [airtimeData, setAirtimeData] = useState<AirtimeFormData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<AirtimeFormData>({
    resolver: zodResolver(airtimeSchema),
    defaultValues: {
      provider: '',
      phoneNumber: '',
      amount: 0,
    },
  });

  const onSubmit = async (data: AirtimeFormData) => {
    setAirtimeData(data);
    setIsPinModalOpen(true);
  };

  const handleQuickAmount = (amount: number) => {
    form.setValue('amount', amount);
  };

  const handlePinConfirm = async () => {
    if (!airtimeData) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: airtimeData.amount,
          category: 'airtime',
          party: {
            name: MOBILE_PROVIDERS.find(p => p.id === airtimeData.provider)?.name || airtimeData.provider,
            billerId: airtimeData.phoneNumber,
          },
          narration: `Airtime purchase for ${airtimeData.phoneNumber}`,
          clientReference: `airtime-${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (result.success && result.transaction_id) {
        setIsPinModalOpen(false);
        // Clear old state and navigate to receipt
        form.reset();
        setAirtimeData(null);
        window.location.href = `/receipt/${result.transaction_id}`;
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred while processing your payment',
        variant: 'destructive',
      });
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove unused success handler since we navigate to receipt page
  // const handlePaymentSuccess = (amount: number, provider: string, phone: string) => {
  //   // This is now handled by the receipt page
  // };

  const selectedProvider = MOBILE_PROVIDERS.find((p) => p.id === form.watch('provider'));

  return (
    <>
      <div className="space-y-6">
        {/* Remove error display since we handle errors in the payment flow */}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Mobile Provider Selection */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Mobile Provider</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {MOBILE_PROVIDERS.map((provider) => {
                      const Logo = networks[provider.id]?.Logo;
                      return (
                        <Card
                          key={provider.id}
                          className="cursor-pointer transition-all hover:border-primary"
                          onClick={() => field.onChange(provider.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center gap-2">
                              {Logo ? (
                                <div className="h-12 w-12">
                                  <Logo className="h-full w-full" />
                                </div>
                              ) : (
                                <div
                                  className={`h-12 w-12 rounded-lg ${provider.color} flex items-center justify-center text-white font-bold text-sm`}
                                >
                                  {provider.name.slice(0, 3)}
                                </div>
                              )}
                              <p className="font-medium text-center">{provider.name}</p>
                              {field.value === provider.id && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="0801234567"
                        {...field}
                        className="pl-10"
                        disabled={isProcessing}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      {...field}
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Amount Selection */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={form.watch('amount') === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={isProcessing}
                  >
                    ₦{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy Airtime'
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* PIN Modal */}
      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handlePinConfirm}
        isProcessing={isProcessing}
        title="Authorize Airtime Purchase"
        description="Enter your 4-digit PIN to authorize this airtime purchase"
      />
    </>
  );
}

export default VFDAirtimePayment;
