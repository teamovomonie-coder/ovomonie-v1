
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Icons
import { Landmark, Briefcase, FileText, Stamp, Building, Wallet, Loader2, CheckCircle, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Types & Schemas
interface TaxType {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
}

interface PaymentHistory {
    id: string;
    taxType: string;
    amount: number;
    date: string;
    status: 'Successful' | 'Failed' | 'Pending';
    reference: string;
}

const taxPaymentSchema = z.object({
  tin: z.string().regex(/^\d{10}-\d{4}$/, "Invalid TIN format. Expected format: 1234567890-0001"),
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

type TaxPaymentData = z.infer<typeof taxPaymentSchema>;

// Mock Data
const taxTypes: TaxType[] = [
    { id: 'paye', name: 'PAYE (Pay As You Earn)', description: 'For personal income tax payments.', icon: Briefcase },
    { id: 'vat', name: 'VAT (Value Added Tax)', description: 'For VAT remittances.', icon: Landmark },
    { id: 'cit', name: 'Company Income Tax', description: 'For corporate tax payments.', icon: Building },
    { id: 'stamp_duty', name: 'Stamp Duty', description: 'For payments on dutiable instruments.', icon: Stamp },
    { id: 'state_tax', name: 'State Taxes', description: 'For state-level taxes like Land Use Charge.', icon: FileText },
];

const mockPaymentHistory: PaymentHistory[] = [
    { id: 'pay-1', taxType: 'VAT', amount: 150000, date: '2024-07-15', status: 'Successful', reference: 'FIRS-12345' },
    { id: 'pay-2', taxType: 'PAYE', amount: 75000, date: '2024-06-30', status: 'Successful', reference: 'FIRS-67890' },
    { id: 'pay-3', taxType: 'Stamp Duty', amount: 5000, date: '2024-06-25', status: 'Successful', reference: 'CBN-11223' },
];

function TaxPaymentDialog({ taxType, onPay }: { taxType: TaxType | null, onPay: (data: any) => void }) {
    const [open, setOpen] = useState(!!taxType);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [taxpayerName, setTaxpayerName] = useState("");
    const { toast } = useToast();

    const form = useForm<TaxPaymentData>({
        resolver: zodResolver(taxPaymentSchema),
        defaultValues: { tin: "", amount: 0 },
    });
    
    const handleTinVerification = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setTaxpayerName("OVOMONIE NIGERIA LTD");
        setIsVerified(true);
        toast({ title: "TIN Verified", description: "Taxpayer details confirmed." });
    };

    const onSubmit = (data: TaxPaymentData) => {
        onPay({ ...data, taxType: taxType?.name });
        setOpen(false);
    };

    if (!taxType) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onPay(null); setOpen(isOpen); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pay {taxType.name}</DialogTitle>
                    <DialogDescription>Enter the details to complete your tax payment.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="tin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tax Identification Number (TIN)</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder="XXXXXXXXXX-XXXX" {...field} disabled={isVerified} />
                                        </FormControl>
                                        <Button type="button" onClick={handleTinVerification} disabled={isLoading || isVerified}>
                                            {isLoading ? <Loader2 className="animate-spin" /> : "Verify"}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {isVerified && (
                             <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
                                <CheckCircle className="h-5 w-5" />
                                <p className="font-semibold">{taxpayerName}</p>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount to Pay (₦)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={!isVerified}>Pay Now</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function TaxDashboard() {
  const [selectedTax, setSelectedTax] = useState<TaxType | null>(null);
  const [history, setHistory] = useState(mockPaymentHistory);
  const { toast } = useToast();

  const handlePayment = (data: any) => {
    if (data) {
        const newPayment: PaymentHistory = {
            id: `pay-${Date.now()}`,
            taxType: data.taxType,
            amount: data.amount,
            date: new Date().toISOString(),
            status: 'Successful',
            reference: `FIRS-${Date.now().toString().slice(-6)}`,
        };
        setHistory(prev => [newPayment, ...prev]);
        toast({ title: "Payment Successful!", description: `Your ${data.taxType} payment has been processed.` });
    }
    setSelectedTax(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tax & Remittance</h2>
      </div>
      
      {selectedTax && <TaxPaymentDialog taxType={selectedTax} onPay={handlePayment} />}

      <Card>
        <CardHeader>
            <CardTitle>Select a Tax Service</CardTitle>
            <CardDescription>Choose the type of tax you want to pay or remit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {taxTypes.map(tax => (
                <Card key={tax.id} className="hover:shadow-md hover:border-primary transition-all cursor-pointer" onClick={() => setSelectedTax(tax)}>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div className="p-3 bg-muted rounded-lg">
                           <tax.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                           <CardTitle className="text-base">{tax.name}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{tax.description}</p>
                    </CardContent>
                </Card>
            ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>A log of all your tax payments made through Ovomonie.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Tax Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Amount (₦)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{format(new Date(item.date), 'dd MMM, yyyy')}</TableCell>
                                <TableCell>{item.taxType}</TableCell>
                                <TableCell>
                                    <span className={cn('px-2 py-1 text-xs rounded-full',
                                        item.status === 'Successful' ? 'bg-green-100 text-green-800' :
                                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    )}>{item.status}</span>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{item.reference}</TableCell>
                                <TableCell className="text-right font-medium">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
