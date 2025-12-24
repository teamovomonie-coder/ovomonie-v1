/**
 * VFD Bill Payment Component
 * Real integration with VFD Bills Payment API
 * Documentation: https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/bills-payment-api/
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, AlertCircle, CheckCircle, Zap, Tv, Wifi, Droplet } from 'lucide-react';
import { pendingTransactionService } from '@/lib/pending-transaction-service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { DynamicReceipt } from './dynamic-receipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReceiptData } from '@/lib/receipt-templates';

const billSchema = z.object({
  billerId: z.string().min(1, 'Select a bill provider'),
  amount: z.number().min(100, 'Amount must be at least ₦100'),
  customerId: z.string().min(3, 'Customer ID is required'),
  phoneNumber: z.string().optional(),
});

type BillFormData = z.infer<typeof billSchema>;

interface Biller {
  id: string;
  name: string;
  division: string;
  product: string;
  category: string;
  convenienceFee?: string;
}

interface VFDBillPaymentProps {
  onSuccess?: (amount: number, provider: string) => void;
  onError?: (error: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Utility': Zap,
  'Cable TV': Tv,
  'Internet Subscription': Wifi,
  'Water': Droplet,
};

export function VFDBillPayment({ onSuccess, onError }: VFDBillPaymentProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [isLoadingBillers, setIsLoadingBillers] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [billData, setBillData] = useState<BillFormData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [paymentToken, setPaymentToken] = useState<string>('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const form = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      billerId: '',
      amount: 0,
      customerId: '',
      phoneNumber: '',
    },
  });

  // Fetch billers on mount (declared after fetchBillers)

  const fetchBillers = useCallback(async () => {
    setIsLoadingBillers(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch('/api/bills/vfd?action=billers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setBillers(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load bill providers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching billers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bill providers',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBillers(false);
    }
  }, [toast]);

  // Fetch billers on mount
  useEffect(() => {
    fetchBillers();
  }, [fetchBillers]);

  const validateCustomer = async (customerId: string) => {
    if (!selectedBiller || customerId.length < 3) return;

    // Validation required for Utility, Cable TV, betting, gaming
    const requiresValidation = ['Utility', 'Cable TV'].includes(selectedBiller.category);
    if (!requiresValidation) return;

    setIsValidating(true);
    setValidationMessage('');

    try {
      const token = localStorage.getItem('ovo-auth-token');
      const response = await fetch(
        `/api/bills/vfd?action=validate&customerId=${encodeURIComponent(customerId)}&division=${selectedBiller.division}&paymentItem=${selectedBiller.id}&billerId=${selectedBiller.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success && result.data.status === '00') {
        setValidationMessage('✓ Customer validated successfully');
      } else {
        setValidationMessage('✗ Invalid customer ID');
        toast({
          title: 'Validation Failed',
          description: 'Please check your customer ID and try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationMessage('✗ Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: BillFormData) => {
    if (!selectedBiller) {
      toast({
        title: 'Error',
        description: 'Please select a biller',
        variant: 'destructive',
      });
      return;
    }

    // Check if validation is required and passed
    const requiresValidation = ['Utility', 'Cable TV'].includes(selectedBiller.category);
    if (requiresValidation && !validationMessage.includes('✓')) {
      toast({
        title: 'Validation Required',
        description: 'Please validate your customer ID before payment',
        variant: 'destructive',
      });
      return;
    }

    setBillData(data);
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = async () => {
    if (!billData || !selectedBiller) return;

    setIsProcessing(true);
    setPaymentToken('');

    try {
      const token = localStorage.getItem('ovo-auth-token');
      const reference = `ovopay-${Date.now()}`;

      const response = await fetch('/api/bills/vfd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: billData.customerId,
          amount: billData.amount,
          division: selectedBiller.division,
          paymentItem: selectedBiller.id,
          productId: selectedBiller.product,
          billerId: selectedBiller.id,
          reference,
          phoneNumber: billData.phoneNumber || undefined,
          billerName: selectedBiller.name,
          category: selectedBiller.category,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsPinModalOpen(false);
        
        // Clear any old receipt state
        setReceiptData(null);
        setShowReceipt(false);
        setPaymentToken('');
        
        // Show token if provided (for electricity)
        if (result.data.token) {
          setPaymentToken(result.data.token);
        }

        // Navigate to receipt page with transaction ID
        if (result.transaction_id) {
          window.location.href = `/receipt/${result.transaction_id}`;
          return;
        }

        // Fallback success handling
        addNotification({
          title: 'Bill Paid Successfully',
          description: `Your ${selectedBiller.name} bill payment of ₦${billData.amount.toLocaleString()} has been processed successfully.`,
          category: 'transaction',
        });

        toast({
          title: 'Success',
          description: result.message || 'Bill payment completed successfully',
        });

        onSuccess?.(billData.amount, selectedBiller.name);
        form.reset();
        setBillData(null);
        setSelectedBiller(null);
        setValidationMessage('');
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
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

  // Group billers by category
  const billersByCategory = billers.reduce((acc, biller) => {
    if (!acc[biller.category]) {
      acc[biller.category] = [];
    }
    acc[biller.category].push(biller);
    return acc;
  }, {} as Record<string, Biller[]>);

  return (
    <>
      <div className="space-y-6">
        {isLoadingBillers ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading bill providers...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="billerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Provider</FormLabel>
                    <div className="space-y-4">
                      {Object.entries(billersByCategory).map(([category, categoryBillers]) => {
                        const Icon = CATEGORY_ICONS[category] || Zap;
                        return (
                          <div key={category}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-xs uppercase text-muted-foreground">
                                {category}
                              </Label>
                            </div>
                            <div className="grid gap-2">
                              {categoryBillers.map((biller) => (
                                <Card
                                  key={biller.id}
                                  className={`cursor-pointer transition-all hover:border-primary ${
                                    field.value === biller.id ? 'border-primary bg-primary/5' : ''
                                  }`}
                                  onClick={() => {
                                    field.onChange(biller.id);
                                    setSelectedBiller(biller);
                                    setValidationMessage('');
                                  }}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{biller.name}</p>
                                        {biller.convenienceFee && (
                                          <p className="text-xs text-muted-foreground">
                                            Fee: ₦{biller.convenienceFee}
                                          </p>
                                        )}
                                      </div>
                                      {field.value === biller.id && (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedBiller && (
                <>
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedBiller.category === 'Utility' ? 'Meter Number' : 
                           selectedBiller.category === 'Cable TV' ? 'Smart Card Number' : 
                           'Customer ID'}
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              placeholder={`Enter your ${selectedBiller.category === 'Utility' ? 'meter number' : 'customer ID'}`}
                              {...field}
                              onBlur={(e) => {
                                field.onBlur();
                                validateCustomer(e.target.value);
                              }}
                              disabled={isProcessing}
                            />
                            {isValidating && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Validating...
                              </p>
                            )}
                            {validationMessage && (
                              <p className={`text-sm ${validationMessage.includes('✓') ? 'text-green-600' : 'text-destructive'}`}>
                                {validationMessage}
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedBiller.id === 'ikedc' && (
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Required for IKEDC)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 09012345678"
                              {...field}
                              disabled={isProcessing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            disabled={isProcessing}
                          />
                        </FormControl>
                        {selectedBiller.id === 'ibedc' && (
                          <p className="text-xs text-muted-foreground">
                            Minimum amount for IBEDC (Band A): ₦5,000
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {paymentToken && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Your Token:</strong> {paymentToken}
                    <br />
                    <span className="text-xs">Enter this token on your meter to load your energy</span>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isProcessing || !selectedBiller || isLoadingBillers}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  'Pay Bill'
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>

      {/* PIN Modal */}
      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handlePinConfirm}
        isProcessing={isProcessing}
        title="Authorize Bill Payment"
        description={`Enter your PIN to pay ₦${billData?.amount.toLocaleString()} to ${selectedBiller?.name}`}
      />

      {/* Virtual Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptData && <DynamicReceipt receipt={receiptData} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VFDBillPayment;
