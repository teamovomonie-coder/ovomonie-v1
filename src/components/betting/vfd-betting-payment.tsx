/**
 * VFD Betting Payment Component
 * Handles betting platform deposits through VFD
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
import { useBettingPayment } from '@/hooks/use-vfd-payment';
import { Loader2, AlertCircle, CheckCircle, Dice5 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const bettingSchema = z.object({
  bettingPlatform: z.string().min(1, 'Select a betting platform'),
  amount: z.number().min(100, 'Minimum deposit is ₦100'),
  accountId: z.string().optional(),
});

type BettingFormData = z.infer<typeof bettingSchema>;

const BETTING_PLATFORMS = [
  { id: 'bet9ja', name: 'Bet9ja', description: 'Nigeria\'s Leading Betting Platform' },
  { id: 'betking', name: 'BetKing', description: 'Football & Sports Betting' },
  { id: 'nairabet', name: 'Nairabet', description: 'Sports & Esports Betting' },
  { id: 'sportybetng', name: 'SportyBet', description: 'Online Sports Betting' },
  { id: 'betlion', name: 'BetLion', description: 'Live Betting Platform' },
  { id: 'betway', name: 'Betway', description: 'Global Betting Provider' },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

interface VFDBettingPaymentProps {
  onSuccess?: (amount: number, platform: string) => void;
  onError?: (error: string) => void;
}

export function VFDBettingPayment({ onSuccess, onError }: VFDBettingPaymentProps) {
  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const bettingPayment = useBettingPayment();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [bettingData, setBettingData] = useState<BettingFormData | null>(null);

  const form = useForm<BettingFormData>({
    resolver: zodResolver(bettingSchema),
    defaultValues: {
      bettingPlatform: '',
      amount: 0,
      accountId: '',
    },
  });

  const onSubmit = async (data: BettingFormData) => {
    setBettingData(data);
    setIsPinModalOpen(true);
  };

  const handleQuickAmount = (amount: number) => {
    form.setValue('amount', amount);
  };

  const handlePinConfirm = async () => {
    if (!bettingData) return;

    const success = await bettingPayment.pay(
      bettingData.amount,
      {
        bettingProvider: bettingData.bettingPlatform,
        metadata: {
          accountId: bettingData.accountId || 'Not provided',
          timestamp: new Date().toISOString(),
        },
      }
    );

    if (success) {
      setIsPinModalOpen(false);
      handlePaymentSuccess(bettingData.amount, bettingData.bettingPlatform);
    }
  };

  const handlePaymentSuccess = (amount: number, platform: string) => {
    const platformName = BETTING_PLATFORMS.find((p) => p.id === platform)?.name || platform;

    // Save receipt data for success page
    const receiptData = {
      type: 'betting',
      data: {
        platform,
        accountId: bettingData?.accountId || 'N/A',
        amount,
      },
      recipientName: platformName,
      transactionId: bettingPayment.reference || `betting_${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('ovo-pending-receipt', JSON.stringify(receiptData));

    addNotification({
      title: 'Betting Account Funded',
      description: `₦${amount.toLocaleString()} deposited to your ${platformName} account`,
      category: 'transaction',
    });

    toast({
      title: 'Success',
      description: `₦${amount.toLocaleString()} added to ${platformName}`,
    });

    onSuccess?.(amount, platform);
    bettingPayment.resetState();
    form.reset();
    setBettingData(null);
  };

  return (
    <>
      <div className="space-y-6">
        {bettingPayment.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{bettingPayment.error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Betting Platform Selection */}
            <FormField
              control={form.control}
              name="bettingPlatform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Betting Platform</FormLabel>
                  <div className="grid grid-cols-1 gap-2">
                    {BETTING_PLATFORMS.map((platform) => (
                      <Card
                        key={platform.id}
                        className="cursor-pointer transition-all hover:border-primary"
                        onClick={() => field.onChange(platform.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                                <Dice5 className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{platform.name}</p>
                                <p className="text-sm text-muted-foreground">{platform.description}</p>
                              </div>
                            </div>
                            {field.value === platform.id && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Betting Account ID (Optional) */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account/Username (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your betting account ID or username"
                      {...field}
                      disabled={bettingPayment.isLoading}
                    />
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
                  <FormLabel>Deposit Amount (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 5000"
                      {...field}
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      disabled={bettingPayment.isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Amount Selection */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Deposit Amounts</Label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={form.watch('amount') === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={bettingPayment.isLoading}
                  >
                    ₦{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Betting involves risk. Please gamble responsibly. 18+ only.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={bettingPayment.isLoading}
            >
              {bettingPayment.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Deposit to Betting'
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
        isProcessing={bettingPayment.isLoading}
        title="Authorize Betting Deposit"
        description="Enter your 4-digit PIN to authorize this betting deposit"
      />
    </>
  );
}

export default VFDBettingPayment;
