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
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useAirtimePayment } from '@/hooks/use-vfd-payment';
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
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const airtimePayment = useAirtimePayment();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [airtimeData, setAirtimeData] = useState<AirtimeFormData | null>(null);

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

    const success = await airtimePayment.pay(
      airtimeData.amount,
      airtimeData.phoneNumber,
      airtimeData.provider
    );

    if (success) {
      setIsPinModalOpen(false);
      handlePaymentSuccess(
        airtimeData.amount,
        airtimeData.provider,
        airtimeData.phoneNumber
      );
    }
  };

  const handlePaymentSuccess = (amount: number, provider: string, phone: string) => {
    const providerName = MOBILE_PROVIDERS.find((p) => p.id === provider)?.name || provider;

    addNotification({
      title: 'Airtime Purchased',
      description: `₦${amount.toLocaleString()} airtime added to ${phone}`,
      category: 'transaction',
    });

    toast({
      title: 'Success',
      description: `₦${amount.toLocaleString()} added to your ${providerName} account`,
    });

    onSuccess?.(amount, provider, phone);
    airtimePayment.resetState();
    form.reset();
    setAirtimeData(null);
  };

  const selectedProvider = MOBILE_PROVIDERS.find((p) => p.id === form.watch('provider'));

  return (
    <>
      <div className="space-y-6">
        {airtimePayment.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{airtimePayment.error}</AlertDescription>
          </Alert>
        )}

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
                        disabled={airtimePayment.isLoading}
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
                      disabled={airtimePayment.isLoading}
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
                    disabled={airtimePayment.isLoading}
                  >
                    ₦{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={airtimePayment.isLoading}
            >
              {airtimePayment.isLoading ? (
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
        isProcessing={airtimePayment.isLoading}
        title="Authorize Airtime Purchase"
        description="Enter your 4-digit PIN to authorize this airtime purchase"
      />
    </>
  );
}

export default VFDAirtimePayment;
