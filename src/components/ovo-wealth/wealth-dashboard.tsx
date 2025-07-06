
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PiggyBank, Target, ShieldCheck, Leaf, Users, TrendingUp, DollarSign, PlusCircle, Loader2, CheckCircle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useMemo, useEffect, useCallback } from "react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { PinModal } from "@/components/auth/pin-modal"
import { useNotifications } from "@/context/notification-context"


const chartData = [
  { month: "Jan", returns: 1860 },
  { month: "Feb", returns: 3050 },
  { month: "Mar", returns: 2370 },
  { month: "Apr", returns: 2730 },
  { month: "May", returns: 4090 },
  { month: "Jun", returns: 4540 },
];

const chartConfig = {
  returns: {
    label: "Returns (₦)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface InvestmentProduct {
    icon: LucideIcon;
    title: string;
    description: string;
    rate: string;
}

const investmentProducts: InvestmentProduct[] = [
    {
        icon: ShieldCheck,
        title: "Ovo-Fix",
        description: "Lock your funds for a fixed period and enjoy high, guaranteed returns.",
        rate: "Up to 15% p.a."
    },
    {
        icon: Target,
        title: "Ovo-Goals",
        description: "Save towards specific goals like a new car, rent, or tuition.",
        rate: "Up to 12% p.a."
    },
    {
        icon: PiggyBank,
        title: "Ovo-Flex",
        description: "A flexible savings wallet. Withdraw your funds anytime you want.",
        rate: "Up to 10% p.a."
    },
    {
        icon: Users,
        title: "Ovo-Coop",
        description: "Join community cooperative plans to fund projects and earn together.",
        rate: "Variable Returns"
    },
    {
        icon: Leaf,
        title: "Ovo-Grow",
        description: "Invest in high-yield agricultural projects and micro-businesses.",
        rate: "Up to 25% p.a."
    },
];

interface Investment {
    id: string;
    plan: string;
    principal: number;
    returns: number;
    status: 'Active' | 'Flexible' | 'Matured';
    maturityDate: string; // ISO string
    startDate: string; // ISO string
}

const investmentSchema = z.object({
  productId: z.string().min(1, { message: "Please select an investment product." }),
  amount: z.coerce.number().min(1000, { message: "Minimum investment is ₦1,000." }),
  duration: z.string().min(1, { message: "Please select a duration." }),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

function InvestmentSuccessReceipt({ amount, plan, onDone }: { amount: number, plan: string, onDone: () => void }) {
    return (
        <div className="flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <CardTitle className="text-2xl mt-4">Investment Successful!</CardTitle>
                    <CardDescription>
                        You have successfully invested in the {plan} plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Amount Invested</p>
                        <p className="text-3xl font-bold">₦{amount.toLocaleString()}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={onDone} className="w-full">Back to Wealth Dashboard</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function InvestNowDialog({ children, onRequestInvestment, defaultProductTitle }: { children: React.ReactNode; onRequestInvestment: (data: InvestmentFormData) => void; defaultProductTitle?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const form = useForm<InvestmentFormData>({
        resolver: zodResolver(investmentSchema),
        defaultValues: {
            productId: defaultProductTitle || "",
            amount: 1000,
            duration: "30",
        },
    });

    const watchedAmount = form.watch('amount');
    const watchedProductId = form.watch('productId');

    const estimatedReturn = useMemo(() => {
        const product = investmentProducts.find(p => p.title === watchedProductId);
        if (!product || !watchedAmount) return 0;
        
        const rateMatch = product.rate.match(/(\d+(\.\d+)?)/);
        if (!rateMatch) return 0;
        
        const annualRate = parseFloat(rateMatch[0]) / 100;
        return (watchedAmount * annualRate / 365) * parseInt(form.getValues('duration') || '0');

    }, [watchedAmount, watchedProductId, form]);


    const onSubmit = (data: InvestmentFormData) => {
        onRequestInvestment(data);
        setIsOpen(false);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a New Investment</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to start your investment journey.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Investment Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {investmentProducts.map(p => <SelectItem key={p.title} value={p.title}>{p.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount to Invest (₦)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="30">30 Days</SelectItem>
                                            <SelectItem value="90">90 Days</SelectItem>
                                            <SelectItem value="180">180 Days</SelectItem>
                                            <SelectItem value="365">1 Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="bg-muted p-3 rounded-md text-center">
                            <p className="text-sm text-muted-foreground">Estimated Returns</p>
                            <p className="text-lg font-bold text-primary">
                                ~ ₦{estimatedReturn.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">
                                Confirm Investment
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


export function WealthDashboard() {
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { balance, updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  
  const [pendingInvestment, setPendingInvestment] = useState<InvestmentFormData | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{ amount: number; plan: string; } | null>(null);


  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/wealth/investments');
        if (!response.ok) throw new Error('Failed to fetch investments');
        const data = await response.json();
        setUserInvestments(data);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Could not load investments',
            description: error instanceof Error ? error.message : 'Please try again later.',
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);
  
  const handleInvestmentRequest = (data: InvestmentFormData) => {
    if (balance === null || (data.amount * 100) > balance) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is not enough for this investment.' });
        return;
    }
    setPendingInvestment(data);
    setIsPinModalOpen(true);
  };
  
  const handleConfirmInvestment = async () => {
    if (!pendingInvestment) return;
    setIsProcessing(true);
    
    const product = investmentProducts.find(p => p.title === pendingInvestment.productId);
    if (!product) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected product not found.' });
        setIsProcessing(false);
        return;
    };

    const rateMatch = product.rate.match(/(\d+(\.\d+)?)/);
    const annualRate = rateMatch ? parseFloat(rateMatch[0]) / 100 : 0.1;
    const estimatedReturn = (pendingInvestment.amount * annualRate / 365) * parseInt(pendingInvestment.duration);
    
    try {
        const clientReference = `investment-${crypto.randomUUID()}`;
        const response = await fetch('/api/wealth/investments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...pendingInvestment, estimatedReturn, clientReference }),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to create investment.');

        updateBalance(result.newBalance);
        addNotification({
            title: 'Investment Successful!',
            description: `You invested ₦${pendingInvestment.amount.toLocaleString()} in ${pendingInvestment.productId}.`,
            category: 'transaction',
        });
        await fetchInvestments();
        setReceiptData({ amount: pendingInvestment.amount, plan: pendingInvestment.productId });

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Investment Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
    } finally {
        setIsProcessing(false);
        setIsPinModalOpen(false);
        setPendingInvestment(null);
    }
  };
  
  const { totalInvestment, totalReturns } = useMemo(() => {
    return userInvestments.reduce((acc, inv) => {
      acc.totalInvestment += inv.principal;
      acc.totalReturns += inv.returns;
      return acc;
    }, { totalInvestment: 0, totalReturns: 0 });
  }, [userInvestments]);
  
  if (receiptData) {
      return <InvestmentSuccessReceipt amount={receiptData.amount} plan={receiptData.plan} onDone={() => setReceiptData(null)} />
  }

  return (
    <>
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Ovo-Wealth</h2>
                <div className="flex items-center space-x-2">
                    <Button>Withdraw</Button>
                    <InvestNowDialog onRequestInvestment={handleInvestmentRequest}>
                        <Button variant="secondary"><PlusCircle className="mr-2 h-4 w-4" /> Invest Now</Button>
                    </InvestNowDialog>
                </div>
            </div>
            <Tabs defaultValue="portfolio" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
                    <TabsTrigger value="explore">Explore Products</TabsTrigger>
                </TabsList>
                <TabsContent value="portfolio" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₦{(totalInvestment / 100).toLocaleString()}</div>}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-primary">+₦{(totalReturns / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
                                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₦105,000</div> }
                                <p className="text-xs text-muted-foreground">On Dec 31, 2024</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Risk Profile</CardTitle>
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Moderate</div>
                                <p className="text-xs text-muted-foreground">Balanced portfolio</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Portfolio Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`} />
                                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Bar dataKey="returns" fill="var(--color-returns)" radius={8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="col-span-4 lg:col-span-3">
                            <CardHeader>
                                <CardTitle>My Investments</CardTitle>
                                <CardDescription>Your active investment plans.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Plan</TableHead>
                                                <TableHead className="text-right">Returns</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userInvestments.map((investment) => (
                                                <TableRow key={investment.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{investment.plan}</div>
                                                        <div className="text-xs text-muted-foreground">Matures: {format(new Date(investment.maturityDate), 'dd MMM yyyy')}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-primary">
                                                        +₦{(investment.returns / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge>{investment.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="explore" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {investmentProducts.map((product) => (
                            <Card key={product.title} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-muted rounded-lg">
                                            <product.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{product.title}</CardTitle>
                                            <p className="font-bold text-primary">{product.rate}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <CardDescription>{product.description}</CardDescription>
                                </CardContent>
                                <CardFooter>
                                    <InvestNowDialog onRequestInvestment={handleInvestmentRequest} defaultProductTitle={product.title}>
                                        <Button className="w-full">Invest Now</Button>
                                    </InvestNowDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <PinModal
            open={isPinModalOpen}
            onOpenChange={setIsPinModalOpen}
            onConfirm={handleConfirmInvestment}
            isProcessing={isProcessing}
            title="Authorize Investment"
            description="Enter your 4-digit PIN to confirm this investment."
        />
    </>
  )
}
