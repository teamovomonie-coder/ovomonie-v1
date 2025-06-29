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
import { HandCoins, Briefcase, Store, Siren, ArrowLeft, Loader2, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { add, format } from 'date-fns';

type View = 'dashboard' | 'apply' | 'offer' | 'success';

const loanApplicationSchema = z.object({
  loanType: z.string().min(1, 'Please select a loan type.'),
  amount: z.coerce.number().min(10000, 'Minimum loan amount is ₦10,000.'),
  duration: z.coerce.number().min(1, 'Minimum duration is 1 month.'),
  purpose: z.string().min(3, 'Please state the purpose of the loan.'),
  employmentStatus: z.string().min(1, 'Please select your employment status.'),
});

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

const LOAN_INTEREST_RATE = 0.05; // 5% monthly interest

const loanTypes = [
    { id: 'personal', label: 'Personal Loan', icon: HandCoins },
    { id: 'business', label: 'Business Loan', icon: Briefcase },
    { id: 'agent', label: 'Agent Loan', icon: Store },
    { id: 'emergency', label: 'Emergency Loan', icon: Siren },
];

const mockRepaymentHistory = [
    { date: '2024-06-15', amount: 10833.33, status: 'Paid' },
    { date: '2024-07-15', amount: 10833.33, status: 'Paid' },
    { date: '2024-08-15', amount: 10833.33, status: 'Due' },
];

function LoanCalculator({ amount, duration }: { amount: number; duration: number }) {
  const { totalRepayable, monthlyPayment } = useMemo(() => {
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

export function LoanDashboard() {
  const [view, setView] = useState<View>('dashboard');
  const [applicationData, setApplicationData] = useState<LoanApplicationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: { amount: 10000, duration: 1, loanType: '', purpose: '', employmentStatus: '' },
  });
  const watchedAmount = form.watch('amount');
  const watchedDuration = form.watch('duration');

  const handleApply = (data: LoanApplicationData) => {
    setIsProcessing(true);
    setTimeout(() => {
      setApplicationData(data);
      setView('offer');
      setIsProcessing(false);
    }, 1500);
  };
  
  const handleAcceptOffer = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setView('success');
          setIsProcessing(false);
          toast({ title: 'Loan Approved!', description: `₦${applicationData?.amount.toLocaleString()} has been credited to your wallet.`});
      }, 1500)
  }

  const reset = () => {
    setView('dashboard');
    setApplicationData(null);
    form.reset();
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
                    <FormControl><Slider min={10000} max={1000000} step={5000} defaultValue={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} /></FormControl>
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
      const { totalRepayable, monthlyPayment } = useMemo(() => {
        const interest = applicationData.amount * LOAN_INTEREST_RATE * applicationData.duration;
        const totalRepayable = applicationData.amount + interest;
        const monthlyPayment = totalRepayable / applicationData.duration;
        return { totalRepayable, monthlyPayment };
      }, [applicationData]);

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

        {/* This would be conditional based on if a user has a loan */}
        <Card>
            <CardHeader>
                <CardTitle>My Active Loan</CardTitle>
                <CardDescription>Personal Loan for School Fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Loan Balance</p>
                        <p className="text-2xl font-bold">₦75,000.00</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Next Payment</p>
                        <p className="text-2xl font-bold">₦10,833.33</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="text-2xl font-bold">Aug 15, 2024</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Interest Rate</p>
                        <p className="text-2xl font-bold">5% p.m.</p>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Repayment Progress</p>
                        <p className="text-sm text-muted-foreground">2 of 12 months paid</p>
                    </div>
                    <Progress value={(2 / 12) * 100} />
                </div>
                 <div>
                    <Button>Make Repayment</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Repayment History</CardTitle>
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
                        {mockRepaymentHistory.map((item, index) => (
                             <TableRow key={index}>
                                <TableCell>{item.date}</TableCell>
                                <TableCell>₦{item.amount.toLocaleString()}</TableCell>
                                <TableCell><span className={`px-2 py-1 text-xs rounded-full ${item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
