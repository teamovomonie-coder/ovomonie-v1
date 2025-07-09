

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { PinModal } from '@/components/auth/pin-modal';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, Search, PieChart, Info, CheckCircle, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    category: string;
    Logo: React.ElementType;
}

interface Holding {
    userId: string;
    symbol: string;
    quantity: number;
    avgBuyPrice: number;
}

const tradeSchema = z.object({
  orderType: z.enum(['Market', 'Limit']),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  limitPrice: z.coerce.number().optional(),
}).refine(data => {
    return data.orderType === 'Limit' ? data.limitPrice && data.limitPrice > 0 : true;
}, { message: 'Limit price is required for limit orders.', path: ['limitPrice'] });

type TradeFormData = z.infer<typeof tradeSchema>;

function TradeDialog({ stock, onTrade }: { stock: Stock, onTrade: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    
    const form = useForm<TradeFormData>({
        resolver: zodResolver(tradeSchema),
        defaultValues: { orderType: 'Market', quantity: 0, limitPrice: 0 },
    });
    
    const watchedOrderType = form.watch('orderType');
    const watchedQuantity = form.watch('quantity');

    const handleTrade = (values: TradeFormData) => {
        onTrade({ ...values, stock });
        setOpen(false);
    };
    
    const estimatedCost = useMemo(() => {
        const price = watchedOrderType === 'Limit' && form.getValues('limitPrice') ? form.getValues('limitPrice')! : stock.price;
        return (watchedQuantity || 0) * price;
    }, [watchedQuantity, watchedOrderType, stock.price, form]);
    
    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) form.reset(); }}>
            <DialogTrigger asChild><Button size="sm">Trade</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Place a Trade Order for {stock.symbol}</DialogTitle>
                    <DialogDescription>Current Market Price: ₦{stock.price.toFixed(2)}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="buy">Buy</TabsTrigger><TabsTrigger value="sell">Sell</TabsTrigger></TabsList>
                    <TabsContent value="buy" className="pt-4">
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleTrade)} className="space-y-4">
                                <FormField control={form.control} name="orderType" render={({ field }) => (
                                    <FormItem><FormLabel>Order Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Market">Market Order</SelectItem><SelectItem value="Limit">Limit Order</SelectItem></SelectContent>
                                        </Select><FormMessage />
                                    </FormItem>
                                )}/>
                                 <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}/></FormControl><FormMessage /></FormItem>)}/>
                                      {watchedOrderType === 'Limit' && (<FormField control={form.control} name="limitPrice" render={({ field }) => (<FormItem><FormLabel>Limit Price (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 215.00" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}/></FormControl><FormMessage /></FormItem>)}/>)}
                                 </div>
                                 <Card className="bg-muted"><CardContent className="p-3 text-center"><p className="text-sm text-muted-foreground">Estimated Cost</p><p className="text-lg font-bold">₦{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></CardContent></Card>
                                 <DialogFooter><Button type="submit" className="w-full">Place Buy Order</Button></DialogFooter>
                            </form>
                         </Form>
                    </TabsContent>
                    <TabsContent value="sell" className="pt-4"><p className="text-center text-muted-foreground p-8">Sell functionality coming soon.</p></TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

const MtnLogo = () => <div className="w-6 h-6 rounded-full bg-[#FFCC00] flex items-center justify-center"><span className="text-[#004A99] font-bold text-xs">MTN</span></div>;
const ZenithLogo = () => <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">Z</div>;
const GtcoLogo = () => <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">GT</div>;
const DangoteLogo = () => <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">DC</div>;

const logoMap: Record<string, React.ElementType> = {
    MTNN: MtnLogo,
    ZENITHBANK: ZenithLogo,
    GTCO: GtcoLogo,
    DANGCEM: DangoteLogo,
    BUACEMENT: () => <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-xs">BUA</div>,
    SEPLAT: () => <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs">SE</div>
};

export function StockTradingDashboard() {
    const { toast } = useToast();
    const { updateBalance } = useAuth();
    const { addNotification } = useNotifications();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [holdings, setHoldings] = useState<Holding[]>([]);

    const [pendingTrade, setPendingTrade] = useState<any>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("Authentication failed.");
            const [marketRes, portfolioRes] = await Promise.all([
                fetch('/api/stocks/market-data', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/stocks/portfolio', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!marketRes.ok || !portfolioRes.ok) throw new Error("Failed to fetch stock data.");

            const marketData = await marketRes.json();
            const portfolioData = await portfolioRes.json();
            
            setStocks(marketData.map((s:any) => ({...s, Logo: logoMap[s.symbol]})));
            setHoldings(portfolioData);

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTradeRequest = (data: any) => {
        setPendingTrade(data);
        setIsPinModalOpen(true);
    };

    const executeTrade = async () => {
        if (!pendingTrade) return;
        setIsProcessing(true);
        setApiError(null);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("Authentication required.");

            const response = await fetch('/api/stocks/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...pendingTrade,
                    tradeType: 'buy', // Only buys are supported for now
                    clientReference: `trade-${crypto.randomUUID()}`
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Trade execution failed.');

            updateBalance(result.newBalanceInKobo);
            addNotification({
                title: 'Trade Order Placed!',
                description: `Your order for ${pendingTrade.quantity} ${pendingTrade.stock.symbol} units was successful.`,
                category: 'transaction',
            });
            toast({ title: 'Trade Successful!' });
            await fetchData(); // Refresh data

        } catch (error) {
            setApiError((error as Error).message);
        } finally {
            setIsPinModalOpen(false);
            setIsProcessing(false);
            setPendingTrade(null);
        }
    };

    const filteredStocks = useMemo(() => {
        if (!searchQuery) return stocks;
        return stocks.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, stocks]);

    const stockCategories = useMemo(() => {
        return filteredStocks.reduce((acc, stock) => {
            (acc[stock.category] = acc[stock.category] || []).push(stock);
            return acc;
        }, {} as Record<string, Stock[]>);
    }, [filteredStocks]);

    const { topGainers, topLosers } = useMemo(() => {
        const sorted = [...stocks].sort((a, b) => b.change - a.change);
        return {
            topGainers: sorted.slice(0, 3),
            topLosers: sorted.slice(-3).reverse(),
        };
    }, [stocks]);

    const { portfolioValue, todaysGainLoss, portfolioHoldings } = useMemo(() => {
        if (!holdings.length || !stocks.length) return { portfolioValue: 0, todaysGainLoss: 0, portfolioHoldings: [] };
        
        const enrichedHoldings = holdings.map(h => {
            const currentStock = stocks.find(s => s.symbol === h.symbol);
            return { ...h, currentPrice: currentStock?.price || h.avgBuyPrice, name: currentStock?.name || h.symbol };
        });

        const value = enrichedHoldings.reduce((acc, h) => acc + (h.quantity * h.currentPrice), 0);
        const cost = enrichedHoldings.reduce((acc, h) => acc + (h.quantity * h.avgBuyPrice), 0);
        
        return { portfolioValue: value, todaysGainLoss: value - cost, portfolioHoldings: enrichedHoldings };
    }, [holdings, stocks]);
    
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24" /> <Skeleton className="h-24" /> <Skeleton className="h-24" /> <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-96" />
            </div>
        )
    }

  return (
    <>
    <div className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-3xl font-bold tracking-tight">Stock Trading</h2></div>
        <Tabs defaultValue="market" className="space-y-4">
            <TabsList><TabsTrigger value="market">Market</TabsTrigger><TabsTrigger value="portfolio">Portfolio</TabsTrigger><TabsTrigger value="watchlist">Watchlist</TabsTrigger></TabsList>
            <TabsContent value="market" className="space-y-4">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input placeholder="Search stocks by name or symbol..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                 <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="text-green-500"/> Top Gainers</CardTitle></CardHeader><CardContent><Table><TableBody>{topGainers.map(stock => (<TableRow key={stock.symbol}><TableCell className="font-semibold">{stock.symbol}</TableCell><TableCell className="text-right">₦{stock.price.toFixed(2)}</TableCell><TableCell className="text-right text-green-500 font-semibold">+{(stock.change / (stock.price - stock.change) * 100).toFixed(2)}%</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="text-red-500"/> Top Losers</CardTitle></CardHeader><CardContent><Table><TableBody>{topLosers.map(stock => (<TableRow key={stock.symbol}><TableCell className="font-semibold">{stock.symbol}</TableCell><TableCell className="text-right">₦{stock.price.toFixed(2)}</TableCell><TableCell className="text-right text-red-500 font-semibold">{(stock.change / (stock.price - stock.change) * 100).toFixed(2)}%</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                </div>
                {Object.entries(stockCategories).map(([category, stocks]) => (
                     <Card key={category}>
                        <CardHeader><CardTitle>{category}</CardTitle></CardHeader>
                        <CardContent>
                            <Table><TableHeader><TableRow><TableHead>Stock</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Change</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{stocks.map((stock) => (<TableRow key={stock.symbol}><TableCell className="font-medium"><div className="flex items-center gap-2"><stock.Logo /><div><div>{stock.symbol}</div><div className="text-xs text-muted-foreground">{stock.name}</div></div></div></TableCell><TableCell className="text-right font-semibold">₦{stock.price.toFixed(2)}</TableCell><TableCell className={cn("text-right font-semibold", stock.change >= 0 ? 'text-green-500' : 'text-red-500')}>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}</TableCell><TableCell className="text-right"><TradeDialog stock={stock} onTrade={handleTradeRequest} /></TableCell></TableRow>))}</TableBody></Table>
                        </CardContent>
                    </Card>
                ))}
            </TabsContent>
            <TabsContent value="portfolio" className="space-y-4">
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Portfolio Value</CardTitle><PieChart className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦{portfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Today's P/L</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className={cn("text-2xl font-bold", todaysGainLoss >= 0 ? "text-green-500" : "text-red-500")}>{todaysGainLoss >= 0 ? '+' : ''}₦{todaysGainLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Buying Power</CardTitle><Wallet className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦{1250345..toLocaleString()}</div></CardContent></Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle>My Holdings</CardTitle></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Stock</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Avg. Cost</TableHead><TableHead className="text-right">Market Value</TableHead><TableHead className="text-right">Total P/L</TableHead></TableRow></TableHeader><TableBody>{portfolioHoldings.map(h => {const marketValue = h.quantity * h.currentPrice; const totalCost = h.quantity * h.avgBuyPrice; const profitLoss = marketValue - totalCost; return (<TableRow key={h.symbol}><TableCell className="font-medium">{h.symbol}</TableCell><TableCell className="text-right">{h.quantity}</TableCell><TableCell className="text-right">₦{h.avgBuyPrice.toFixed(2)}</TableCell><TableCell className="text-right">₦{marketValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell><TableCell className={cn("text-right font-semibold", profitLoss >= 0 ? 'text-green-500' : 'text-red-500')}>{profitLoss >= 0 ? '+' : ''}₦{profitLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell></TableRow>)})}</TableBody></Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="watchlist">
                <Card className="text-center py-20"><CardHeader><Info className="mx-auto h-12 w-12 text-muted-foreground" /><CardTitle>Watchlist Coming Soon</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">This section will allow you to pin and track your favorite stocks.</p></CardContent></Card>
            </TabsContent>
        </Tabs>
    </div>
    <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={executeTrade}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Authorize Trade"
    />
    </>
  );
}
