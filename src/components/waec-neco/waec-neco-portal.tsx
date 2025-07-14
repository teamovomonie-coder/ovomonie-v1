
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PinModal } from '@/components/auth/pin-modal';

// Icons
import { BookOpen, Clipboard, Download, Loader2, Search, Share2, Ticket } from 'lucide-react';

// Auth & Notifications
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';

// Schemas
const buyPinSchema = z.object({
  examBody: z.string().min(1, 'Please select an exam body.'),
  examType: z.string().min(1, 'Please select an exam type.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(10, 'Max 10 PINs per transaction.'),
});

const checkResultSchema = z.object({
  examBody: z.string().min(1, 'Please select an exam body.'),
  pin: z.string().min(10, 'PIN is required.'),
  examNumber: z.string().min(10, 'Exam number is required.'),
  examYear: z.string().length(4, 'Enter a valid year.'),
});

type BuyPinData = z.infer<typeof buyPinSchema>;
type CheckResultData = z.infer<typeof checkResultSchema>;

// Mock Data
const examData = {
  waec: {
    name: 'WAEC',
    price: 3500,
    types: ['SSCE (May/June)', 'GCE (Nov/Dec)'],
  },
  neco: {
    name: 'NECO',
    price: 2000,
    types: ['SSCE (June/July)', 'GCE (Nov/Dec)'],
  },
};

const mockHistory = [
  { id: 'PIN-1', body: 'WAEC', type: 'SSCE (May/June)', quantity: 1, date: '2024-07-20', total: 3500 },
  { id: 'PIN-2', body: 'NECO', type: 'GCE (Nov/Dec)', quantity: 2, date: '2024-06-15', total: 4000 },
];

const mockResult = {
  name: 'PAAGO DAVID',
  examNumber: '4012345678',
  subjects: [
    { name: 'English Language', grade: 'B3' },
    { name: 'Mathematics', grade: 'A1' },
    { name: 'Physics', grade: 'B2' },
    { name: 'Chemistry', grade: 'A1' },
    { name: 'Biology', grade: 'B3' },
    { name: 'Economics', grade: 'C4' },
    { name: 'Yoruba Language', grade: 'A1' },
  ],
};

function BuyPinForm() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{ pins: string[], total: number } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<BuyPinData | null>(null);
  const { toast } = useToast();
  const { balance, updateBalance, logout } = useAuth();
  const { addNotification } = useNotifications();

  const form = useForm<BuyPinData>({
    resolver: zodResolver(buyPinSchema),
    defaultValues: { quantity: 1, examBody: 'waec' },
  });
  
  const watchedBody = form.watch('examBody');
  const watchedQuantity = form.watch('quantity');
  const price = watchedBody ? examData[watchedBody as keyof typeof examData].price : 0;
  const total = price * watchedQuantity;

  const onSubmit = (data: BuyPinData) => {
    if (balance === null || total * 100 > balance) {
      toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this purchase.' });
      return;
    }
    setPendingPurchase(data);
    setIsPinModalOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pendingPurchase) return;

    setIsProcessing(true);
    setApiError(null);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const clientReference = `exam-pin-${crypto.randomUUID()}`;
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                clientReference,
                amount: total,
                category: 'education',
                narration: `${pendingPurchase.quantity} ${pendingPurchase.examBody.toUpperCase()} PIN(s) Purchase`,
                party: { name: pendingPurchase.examBody.toUpperCase() }
            })
        });
        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'PIN purchase failed.');
            error.response = response;
            throw error;
        }

        updateBalance(result.newBalanceInKobo);
        addNotification({
            title: 'Exam PIN Purchased',
            description: `You bought ${pendingPurchase.quantity} ${pendingPurchase.examBody.toUpperCase()} PIN(s).`,
            category: 'transaction',
        });

        const generatedPins = Array.from({ length: pendingPurchase.quantity }, () => `${pendingPurchase.examBody.toUpperCase()}-${Math.random().toString().slice(2, 14)}`);
        setReceipt({ pins: generatedPins, total });
        setIsPinModalOpen(false);
        form.reset();

    } catch (error: any) {
        let description = "An unknown error occurred.";
        if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
            description = error.message;
        }
        setApiError(description);
    } finally {
        setIsProcessing(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'PIN Copied!' });
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="examBody" render={({ field }) => (
            <FormItem>
              <FormLabel>Examination Body</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="waec">WAEC</SelectItem>
                  <SelectItem value="neco">NECO</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}/>
          {watchedBody && (
            <FormField control={form.control} name="examType" render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select exam type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {examData[watchedBody as keyof typeof examData].types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
          )}
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
            </FormItem>
          )}/>
          <Card className="bg-muted">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">₦{total.toLocaleString()}</span>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full" disabled={isProcessing || !watchedBody}>
            {isProcessing ? <Loader2 className="animate-spin" /> : 'Proceed to Payment'}
          </Button>
        </form>
      </Form>

      <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmPurchase}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Authorize PIN Purchase"
      />

      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Purchase Successful!</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p>Your PIN(s) have been generated. Please copy and store them safely.</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {receipt?.pins.map(pin => (
                <div key={pin} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="font-mono text-sm">{pin}</span>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pin)}><Clipboard className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div className="text-right font-bold">Total Paid: ₦{receipt?.total.toLocaleString()}</div>
          </div>
          <DialogFooter><Button onClick={() => setReceipt(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CheckResultForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<typeof mockResult | null>(null);

    const form = useForm<CheckResultData>({
        resolver: zodResolver(checkResultSchema),
        defaultValues: { examBody: 'waec', examYear: '2023' }
    });

    const onSubmit = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResult(mockResult);
        setIsLoading(false);
    }

    if (result) {
        return (
            <div className="space-y-4">
                <Button variant="outline" onClick={() => setResult(null)}>Check Another Result</Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Result for {result.name}</CardTitle>
                        <CardDescription>Exam Number: {result.examNumber}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {result.subjects.map(s => <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell className="text-right font-bold">{s.grade}</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                     <CardFooter className="gap-2">
                        <Button variant="outline" className="w-full"><Share2 className="mr-2" /> Share</Button>
                        <Button className="w-full"><Download className="mr-2" /> Print/Save</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="examBody" render={({ field }) => (
                    <FormItem><FormLabel>Examination Body</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="waec">WAEC</SelectItem><SelectItem value="neco">NECO</SelectItem></SelectContent></Select></FormItem>
                )}/>
                <FormField control={form.control} name="pin" render={({ field }) => (
                    <FormItem><FormLabel>PIN</FormLabel><FormControl><Input placeholder="Enter your scratch card PIN" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="examNumber" render={({ field }) => (
                    <FormItem><FormLabel>Examination Number</FormLabel><FormControl><Input placeholder="e.g. 4012345678" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="examYear" render={({ field }) => (
                    <FormItem><FormLabel>Examination Year</FormLabel><FormControl><Input placeholder="e.g. 2023" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Check Result'}</Button>
            </form>
        </Form>
    )
}

function PurchaseHistory() {
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Exam Body</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total (₦)</TableHead></TableRow></TableHeader>
            <TableBody>
                {mockHistory.map(item => (
                    <TableRow key={item.id}><TableCell>{item.body}</TableCell><TableCell>{item.type}</TableCell><TableCell>{format(new Date(item.date), 'dd MMM, yyyy')}</TableCell><TableCell className="text-right">{item.total.toLocaleString()}</TableCell></TableRow>
                ))}
            </TableBody>
        </Table>
    )
}


export function WaecNecoPortal() {
  return (
    <Tabs defaultValue="buy_pin" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="buy_pin"><Ticket className="mr-2 h-4 w-4" /> Buy PIN</TabsTrigger>
        <TabsTrigger value="check_result"><Search className="mr-2 h-4 w-4" /> Check Result</TabsTrigger>
        <TabsTrigger value="history"><BookOpen className="mr-2 h-4 w-4" /> History</TabsTrigger>
      </TabsList>
      <TabsContent value="buy_pin" className="pt-6"><BuyPinForm /></TabsContent>
      <TabsContent value="check_result" className="pt-6"><CheckResultForm /></TabsContent>
      <TabsContent value="history" className="pt-6"><PurchaseHistory /></TabsContent>
    </Tabs>
  );
}
