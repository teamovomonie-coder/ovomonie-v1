# How to Add New Payment Types to VFD System

This guide shows how to add new payment categories to the existing VFD payment integration.

## Quick Summary

The VFD payment system is modular. To add a new payment type:

1. Create a new React component in `src/components/[service]/vfd-[service]-payment.tsx`
2. Use the appropriate hook from `src/hooks/use-vfd-payment.ts`
3. Wire it into your page/route
4. Done! Transaction logging, error handling, and PIN protection are automatic

## Step-by-Step Guide

### Step 1: Create New Hook (Optional)

If you need a payment-type-specific hook, add it to `src/hooks/use-vfd-payment.ts`:

```typescript
export function use[ServiceName]Payment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, serviceDetails: {
      // Your fields here
      field1: string;
      field2?: string;
    }) => {
      const reference = `service_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'your_category_type', // Add to PaymentCategory type
        description: `${serviceDetails.field1} service`,
        metadata: serviceDetails.metadata,
      });
    },
    [vfdPayment]
  );

  return {
    ...vfdPayment,
    pay,
  };
}
```

### Step 2: Create Payment Component

Create `src/components/[service]/vfd-[service]-payment.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useVFDPayment } from '@/hooks/use-vfd-payment'; // or use[Service]Payment()
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const paymentSchema = z.object({
  amount: z.number().min(100, 'Minimum is ₦100'),
  // Add your fields
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function VFD[Service]Payment({ onSuccess, onError }) {
  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const payment = useVFDPayment(); // or use[Service]Payment()

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      // Your defaults
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setPaymentData(data);
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = async () => {
    if (!paymentData) return;

    const reference = `service_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const success = await payment.initiatePayment({
      amount: paymentData.amount,
      reference,
      category: 'your_category',
      description: 'Your description',
      metadata: {
        // Your metadata
        timestamp: new Date().toISOString(),
      },
    });

    if (success) {
      setIsPinModalOpen(false);
      handlePaymentSuccess(paymentData.amount);
    }
  };

  const handlePaymentSuccess = (amount: number) => {
    addNotification({
      title: 'Payment Successful',
      description: `Your payment of ₦${amount.toLocaleString()} was processed.`,
      category: 'transaction',
    });

    toast({
      title: 'Success',
      description: 'Payment completed',
    });

    onSuccess?.(amount);
    payment.resetState();
    form.reset();
    setPaymentData(null);
  };

  return (
    <>
      <div className="space-y-6">
        {payment.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{payment.error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Add your form fields */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      disabled={payment.isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={payment.isLoading}
            >
              {payment.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Make Payment'
              )}
            </Button>
          </form>
        </Form>
      </div>

      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handlePinConfirm}
        isProcessing={payment.isLoading}
        title="Authorize Payment"
        description="Enter your 4-digit PIN to authorize this payment"
      />
    </>
  );
}

export default VFD[Service]Payment;
```

### Step 3: Add Payment Category Type

Update `src/lib/vfd-processor.ts` to add your category:

```typescript
export type PaymentCategory = 
  | 'card_funding'
  | 'bill_payment'
  | 'airtime'
  | 'betting'
  | 'your_category'  // ← Add here
  | 'loan_payment'
  | 'transfer'
  | 'shopping'
  | 'food_delivery'
  | 'ride'
  | 'flight'
  | 'hotel';
```

### Step 4: Wire into Your Page

In your page component (e.g., `src/app/[service]/page.tsx`):

```typescript
import VFD[Service]Payment from '@/components/[service]/vfd-[service]-payment';

export default function [Service]Page() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <VFD[Service]Payment 
          onSuccess={(amount) => console.log(`Payment: ₦${amount}`)}
          onError={(error) => console.error(error)}
        />
      </div>
    </AppShell>
  );
}
```

## Pre-built Payment Type Examples

### Example 1: Loan Payment

```typescript
// Hook
export function useLoanPayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, loanDetails: { loanId: string; provider: string }) => {
      const reference = `loan_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'loan_payment',
        description: `Loan payment - ${loanDetails.provider}`,
        metadata: loanDetails,
      });
    },
    [vfdPayment]
  );

  return { ...vfdPayment, pay };
}

// Usage
const loanPayment = useLoanPayment();
await loanPayment.pay(5000, { loanId: 'LOAN123', provider: 'Kiva' });
```

### Example 2: Shopping Payment

```typescript
// Hook
export function useShoppingPayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, shoppingDetails: { vendor: string; orderId: string }) => {
      const reference = `shop_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'shopping',
        description: `Purchase from ${shoppingDetails.vendor}`,
        metadata: shoppingDetails,
      });
    },
    [vfdPayment]
  );

  return { ...vfdPayment, pay };
}
```

### Example 3: Ride Payment

```typescript
// Hook
export function useRidePayment() {
  const vfdPayment = useVFDPayment();

  const pay = useCallback(
    async (amount: number, rideDetails: { driver: string; distance: number; destination: string }) => {
      const reference = `ride_${Date.now()}`;
      return vfdPayment.initiatePayment({
        amount,
        reference,
        category: 'ride',
        description: `Ride to ${rideDetails.destination}`,
        metadata: rideDetails,
      });
    },
    [vfdPayment]
  );

  return { ...vfdPayment, pay };
}
```

## Automatic Features (No Extra Code Needed)

Every new payment type automatically gets:

✅ PIN confirmation requirement
✅ Transaction logging to Firestore
✅ Error handling and validation
✅ Loading states
✅ Success notifications
✅ Idempotency checking (no duplicates)
✅ Real-time status checking
✅ OTP support (if VFD requires it)
✅ Responsive UI
✅ User notifications

## Testing Your New Payment Type

1. **Component Testing**:
   - Form validation works
   - PIN modal appears
   - Success notification shows
   - Data resets after payment

2. **Backend Testing**:
   - Check server logs for VFD call
   - Verify Firestore transaction created
   - Check transaction has correct category

3. **Integration Testing**:
   - Payment shows in profile/transactions
   - Wallet balance updates
   - Notifications sent

## Common Patterns

### Pattern 1: Simple Amount Payment
```typescript
const pay = useCallback(
  async (amount: number) => {
    return vfdPayment.initiatePayment({
      amount,
      reference: `type_${Date.now()}`,
      category: 'your_type',
      description: 'Your description',
    });
  },
  [vfdPayment]
);
```

### Pattern 2: Payment with Provider
```typescript
const pay = useCallback(
  async (amount: number, provider: string) => {
    return vfdPayment.initiatePayment({
      amount,
      reference: `type_${Date.now()}`,
      category: 'your_type',
      description: `Payment to ${provider}`,
      metadata: { provider },
    });
  },
  [vfdPayment]
);
```

### Pattern 3: Payment with Multiple Details
```typescript
const pay = useCallback(
  async (amount: number, details: MyPaymentDetails) => {
    return vfdPayment.initiatePayment({
      amount,
      reference: `type_${Date.now()}`,
      category: 'your_type',
      description: `Payment for ${details.item}`,
      metadata: details,
    });
  },
  [vfdPayment]
);
```

## Checklist for New Payment Type

- [ ] Hook created in `src/hooks/use-vfd-payment.ts`
- [ ] Category added to `PaymentCategory` type
- [ ] Component created in `src/components/[service]/`
- [ ] Form validation schema defined
- [ ] PIN modal integrated
- [ ] Success/error handling implemented
- [ ] Integrated into page/route
- [ ] Tested with PIN confirmation
- [ ] Tested with error scenarios
- [ ] Firestore transaction verified
- [ ] Documentation updated

## Need Help?

Refer to these existing implementations:
- **Card Payment**: `src/components/add-money/vfd-card-payment.tsx`
- **Bill Payment**: `src/components/bill-payment/vfd-bill-payment.tsx`
- **Airtime Payment**: `src/components/airtime/vfd-airtime-payment.tsx`
- **Betting Payment**: `src/components/betting/vfd-betting-payment.tsx`

Or check:
- [VFD Integration Docs](./vfd-integration.md)
- [VFD Payment Hooks](../src/hooks/use-vfd-payment.ts)
- [VFD Processor](../src/lib/vfd-processor.ts)
