
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { HandCoins, Briefcase, Store, Siren, ArrowLeft, Loader2, CheckCircle, Info, Wallet } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { add, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PinModal } from '@/components/auth/pin-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { Skeleton } from '@/components/ui/skeleton';

type View = 'dashboard' | 'apply' | 'offer' | 'success';
type PinAction = 'accept_loan' | 'repay_loan' | null;

interface Repayment {
    dueDate: string; // ISO string
    amount: number;
    status: 'Paid' | 'Due';
}

interface ActiveLoan {
    id: string;
    loanType: string;
    purpose: string;
    principal: number;
    balance: number;
    duration: number; // in months
    interestRate: number; // monthly rate
    startDate: string; // ISO string
    repayments: Repayment[];
}

const loanApplicationSchema = z.object({
  loanType: z.string().min(1, 'Please select a loan type.'),
  amount: z.coerce.number().min(10000, 'Minimum loan amount is ₦10,000.'),
  duration: z.coerce.number().min(1, 'Minimum duration is 1 month.'),
  purpose: z.string().min(3, 'Please state the purpose of the loan.'),
  employmentStatus: z.string().min(1, 'Please select your employment status.'),
});

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

const LOAN_INTEREST_RATE = 0.05; // 5% monthly interest
const ELIGIBLE_LOAN_AMOUNT = 75000;

const loanTypes = [
    { id: 'personal', label: 'Personal Loan', icon: HandCoins },
    { id: 'business', label: 'Business Loan', icon: Briefcase },
    { id: 'agent', label: 'Agent Loan', icon: Store },
    { id: 'emergency', label: 'Emergency Loan', icon: Siren },
];

function LoanCalculator({ amount, duration }: { amount: number; duration: number }) {
  const { totalRepayable, monthlyPayment } = useMemo(() => {
    if (duration <= 0) return { totalRepayable: 0, monthlyPayment: 0};
    const interest = amount * LOAN_INTEREST_RATE * duration;
    const totalRepayable = amount + interest;
    const monthlyPayment = totalRepayable / duration;
    return { totalRepayable, monthlyPayment };
  }, [amount, duration]);

  return (
    <Card className="bg-muted">
      <CardContent className="p-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Monthly Payment</p>
          <p className="text-lg font-bold">₦{monthlyPayment > 0 ? monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Repayable</p>
          <p className="text-lg font-bold">₦{totalRepayable > 0 ? totalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const repaymentSchema = z.object({
    amount: z.coerce.number().positive("Amount must be a positive number.")
});

function RepaymentDialog({ open, onOpenChange, loan, onRepay }: { open: boolean, onOpenChange: (open: boolean) => void, loan: ActiveLoan, onRepay: (amount: number) => void }) {
    const nextPayment = loan.repayments.find(r => r.status === 'Due');
    
    const form = useForm<z.infer<typeof repaymentSchema>>({
        resolver: zodResolver(repaymentSchema.refine(data => data.amount <= (loan.balance / 100), {
            message: `Amount cannot exceed the loan balance of ₦${(loan.balance / 100).toLocaleString()}`,
            path: ['amount'],
        })),
        defaultValues: { amount: nextPayment ? nextPayment.amount / 100 : 0 }
    });

    const onSubmit = (data: z.infer<typeof repaymentSchema>) => {
        onRepay(data.amount);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Make a Repayment</DialogTitle>
                    <DialogDescription>Your outstanding balance is ₦{(loan.balance / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Repayment Amount (₦)</FormLabel>
                                    <FormControl><Input type="number" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-xs text-muted-foreground">You can pay any amount up to your outstanding balance.</div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Continue</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function LoanDashboard() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-6">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-3xl">🚀 Coming Soon</CardTitle>
          <CardDescription className="text-base mt-4">
            We're working hard to bring you flexible loan options. Stay tuned!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">What to expect:</p>
            <ul className="text-left space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <HandCoins className="h-4 w-4 mt-0.5 text-primary" />
                <span>Personal & Business Loans</span>
              </li>
              <li className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 mt-0.5 text-primary" />
                <span>Competitive Interest Rates</span>
              </li>
              <li className="flex items-start gap-2">
                <Store className="h-4 w-4 mt-0.5 text-primary" />
                <span>Quick Approval Process</span>
              </li>
              <li className="flex items-start gap-2">
                <Siren className="h-4 w-4 mt-0.5 text-primary" />
                <span>Emergency Loan Options</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
