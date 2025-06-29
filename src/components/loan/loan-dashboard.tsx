
"use client";

import { useState, useMemo } from 'react';
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


type View = 'dashboard' | 'apply' | 'offer' | 'success';

interface ActiveLoan {
    id: string;
    type: string;
    purpose: string;
    principal: number;
    balance: number;
    duration: number; // in months
    interestRate: number; // monthly rate
    startDate: Date;
    repayments: Repayment[];
}

interface Repayment {
    dueDate: Date;
    amount: number;
    status: 'Paid' | 'Due';
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
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof repaymentSchema>>({
        resolver: zodResolver(repaymentSchema.refine(data => data.amount <= loan.balance, {
            message: `Amount cannot exceed the loan balance of ₦${loan.balance.toLocaleString()}`,
            path: ['amount'],
        })),
        defaultValues: { amount: nextPayment?.amount || 0 }
    });

    const onSubmit = (data: z.infer<typeof repaymentSchema>) => {
        onRepay(data.amount);
        toast({ title: 'Repayment Successful', description: `₦${data.amount.toLocaleString()} has been deducted from your wallet.` });
        onOpenChange(false);
        form.reset();
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Make a Repayment</DialogTitle>
                    <DialogDescription>Your outstanding balance is ₦{loan.balance.toLocaleString()}.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Repayment Amount (₦)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-xs text-muted-foreground">You can pay any amount up to your outstanding balance.</div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Pay Now</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function LoanDashboard() {
  const [view, setView] = useState<View>('dashboard');
  const [applicationData, setApplicationData] = useState<LoanApplicationData | null>(null);
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRepayDialogOpen, setIsRepayDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: { amount: 10000, duration: 1, loanType: '', purpose: '', employmentStatus: '' },
  });
  const watchedAmount = form.watch('amount');
  const watchedDuration = form.watch('duration');

  const { totalRepayable, monthlyPayment } = useMemo(() => {
    if (!applicationData) return { totalRepayable: 0, monthlyPayment: 0 };
    const interest = applicationData.amount * LOAN_INTEREST_RATE * applicationData.duration;
    const totalRepayable = applicationData.amount + interest;
    const monthlyPayment = totalRepayable / applicationData.duration;
    return { totalRepayable, monthlyPayment };
  }, [applicationData]);

  const handleApply = (data: LoanApplicationData) => {
    setIsProcessing(true);
    setTimeout(() => {
      setApplicationData(data);
      setView('offer');
      setIsProcessing(false);
    }, 1500);
  };
  
  const handleAcceptOffer = () => {
      if (!applicationData) return;
      setIsProcessing(true);
      setTimeout(() => {
          const startDate = new Date();
          const { totalRepayable, monthlyPayment } = (() => {
            const interest = applicationData.amount * LOAN_INTEREST_RATE * applicationData.duration;
            const totalRepayable = applicationData.amount + interest;
            const monthlyPayment = totalRepayable / applicationData.duration;
            return { totalRepayable, monthlyPayment };
          })();

          const newLoan: ActiveLoan = {
            id: `loan-${Date.now()}`,
            type: loanTypes.find(t => t.id === applicationData.loanType)?.label || 'Loan',
            purpose: applicationData.purpose,
            principal: applicationData.amount,
            balance: totalRepayable,
            duration: applicationData.duration,
            interestRate: LOAN_INTEREST_RATE,
            startDate: startDate,
            repayments: Array.from({ length: applicationData.duration }, (_, i) => ({
                dueDate: add(startDate, { months: i + 1 }),
                amount: monthlyPayment,
                status: 'Due'
            }))
          };

          setActiveLoan(newLoan);
          setView('success');
          setIsProcessing(false);
          toast({ title: 'Loan Approved!', description: `₦${applicationData.amount.toLocaleString()} has been credited to your wallet.`});
      }, 1500)
  }

  const handleRepayment = (amountPaid: number) => {
    if (!activeLoan) return;

    setActiveLoan(prevLoan => {
        if (!prevLoan) return null;
        const newBalance = prevLoan.balance - amountPaid;
        let amountLeftToAssign = amountPaid;

        const newRepayments = prevLoan.repayments.map(repayment => {
            if (repayment.status === 'Due' && amountLeftToAssign > 0) {
                const paymentForThisInstallment = Math.min(amountLeftToAssign, repayment.amount);
                const remainingInInstallment = repayment.amount - paymentForThisInstallment;
                amountLeftToAssign -= paymentForThisInstallment;
                
                return { ...repayment, amount: remainingInInstallment, status: remainingInInstallment <= 0 ? 'Paid' : 'Due' };
            }
            return repayment;
        });

        if (newBalance <= 0) {
            toast({ title: 'Loan Fully Repaid!', description: 'Congratulations on completing your loan repayment.' });
            return null; // Loan is cleared
        }

        return {
            ...prevLoan,
            balance: newBalance,
            repayments: newRepayments,
        };
    });
  };

  const reset = () => {
    setView('dashboard');
    setApplicationData(null);
    form.reset({ amount: 10000, duration: 1, loanType: '', purpose: '', employmentStatus: '' });
  }

  if (view === 'apply') {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setView('dashboard')}><ArrowLeft/></Button>
                <CardTitle>Apply for a Loan</CardTitle>
            </div>
            <CardDescription>Fill in the details below. Our system will evaluate your eligibility in real-time.</CardDescription>
          </CardHeader>
          <CardContent>
             <Alert variant="default" className="mb-6 bg-primary/10 border-primary/20">
                <Wallet className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Loan Eligibility</AlertTitle>
                <AlertDescription>
                   Based on your profile, you are eligible to borrow up to ₦{ELIGIBLE_LOAN_AMOUNT.toLocaleString()}.
                </AlertDescription>
            </Alert>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleApply)} className="space-y-6">
                 <FormField control={form.control} name="loanType" render={({ field }) => (
                  <FormItem><FormLabel>What type of loan do you need?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a loan type" /></SelectTrigger></FormControl>
                        <SelectContent>{loanTypes.map(t => <SelectItem key={t.id} value={t.id}><div className="flex items-center gap-2"><t.icon className="h-4 w-4" />{t.label}</div></SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>How much do you need? (₦{field.value.toLocaleString()})</FormLabel>
                    <FormControl><Slider min={10000} max={ELIGIBLE_LOAN_AMOUNT} step={5000} defaultValue={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem>
                        <FormLabel>For how long? ({field.value} {field.value > 1 ? 'months' : 'month'})</FormLabel>
                        <FormControl><Slider min={1} max={12} step={1} defaultValue={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} /></FormControl>
                    </FormItem>
                )} />

                <LoanCalculator amount={watchedAmount} duration={watchedDuration} />
                
                <FormField control={form.control} name="purpose" render={({ field }) => (
                    <FormItem><FormLabel>Purpose of Loan</FormLabel><FormControl><Input placeholder="e.g., To pay for school fees" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                 <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                  <FormItem><FormLabel>Employment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select your employment status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="employed">Salaried / Employed</SelectItem>
                            <SelectItem value="self-employed">Self-Employed / Business Owner</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                        </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Terms & Conditions</AlertTitle>
                    <AlertDescription>By submitting, you agree to our terms of service and allow us to verify your details for credit scoring.</AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'offer' && applicationData) {
    return (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-6">
            <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                    <CardTitle>🎉 Your Loan Offer is Ready!</CardTitle>
                    <CardDescription>Based on our evaluation, we are pleased to offer you the following loan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Loan Amount</p>
                        <p className="text-4xl font-bold">₦{applicationData.amount.toLocaleString()}</p>
                    </div>
                     <div className="grid grid-cols-2 gap-4 text-center p-4 bg-muted rounded-lg">
                        <div><p className="text-xs text-muted-foreground">Interest Rate</p><p className="font-semibold">5% per month</p></div>
                        <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-semibold">{applicationData.duration} {applicationData.duration > 1 ? 'months' : 'month'}</p></div>
                        <div><p className="text-xs text-muted-foreground">Monthly Payment</p><p className="font-semibold">₦{monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-xs text-muted-foreground">Total Payout</p><p className="font-semibold">₦{totalRepayable.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">Funds will be credited to your Ovomonie wallet instantly upon acceptance.</p>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setView('apply')}>Decline</Button>
                    <Button onClick={handleAcceptOffer} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Accept & Receive Funds'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (view === 'success' && applicationData) {
      return (
           <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-6">
            <Card className="max-w-md mx-auto text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500"/>
                    <CardTitle>Loan Disbursed!</CardTitle>
                    <CardDescription>Your loan has been successfully credited to your Ovomonie wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-left bg-muted p-4 rounded-lg">
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount Received</span><span className="font-bold">₦{applicationData.amount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">First Repayment Date</span><span className="font-bold">{format(add(new Date(), {months: 1}), 'MMM dd, yyyy')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Loan Purpose</span><span className="font-bold">{applicationData.purpose}</span></div>
                </CardContent>
                <CardFooter>
                    <Button onClick={reset} className="w-full">Back to Dashboard</Button>
                </CardFooter>
            </Card>
        </div>
      )
  }

  // Dashboard view
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Loans</h2>
            <Button onClick={() => setView('apply')}>Apply for a Loan</Button>
        </div>

        {activeLoan ? (
            <>
            <Card>
                <CardHeader>
                    <CardTitle>My Active Loan</CardTitle>
                    <CardDescription>{activeLoan.type} for {activeLoan.purpose}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Loan Balance</p>
                            <p className="text-2xl font-bold">₦{activeLoan.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                         <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Next Payment</p>
                            <p className="text-2xl font-bold">₦{activeLoan.repayments.find(r => r.status === 'Due')?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</p>
                        </div>
                         <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="text-2xl font-bold">{activeLoan.repayments.find(r => r.status === 'Due') ? format(activeLoan.repayments.find(r => r.status === 'Due')!.dueDate, 'MMM dd, yyyy') : 'N/A'}</p>
                        </div>
                         <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Interest Rate</p>
                            <p className="text-2xl font-bold">{activeLoan.interestRate * 100}% p.m.</p>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">Repayment Progress</p>
                            <p className="text-sm text-muted-foreground">{activeLoan.repayments.filter(r => r.status === 'Paid').length} of {activeLoan.duration} months paid</p>
                        </div>
                        <Progress value={(activeLoan.repayments.filter(r => r.status === 'Paid').length / activeLoan.duration) * 100} />
                    </div>
                     <div>
                        <Button onClick={() => setIsRepayDialogOpen(true)}>Make Repayment</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Repayment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeLoan.repayments.map((item, index) => (
                                 <TableRow key={index}>
                                    <TableCell>{format(item.dueDate, 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>₦{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell><span className={cn('px-2 py-1 text-xs rounded-full', item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>{item.status}</span></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {isRepayDialogOpen && <RepaymentDialog open={isRepayDialogOpen} onOpenChange={setIsRepayDialogOpen} loan={activeLoan} onRepay={handleRepayment} />}
            </>
        ) : (
            <Card className="text-center py-12">
                <CardContent>
                    <h3 className="text-xl font-semibold">No Active Loans</h3>
                    <p className="text-muted-foreground mt-2 mb-4">You currently do not have any active loans. Apply now to get started.</p>
                    <Button onClick={() => setView('apply')}>Apply for a Loan</Button>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

    