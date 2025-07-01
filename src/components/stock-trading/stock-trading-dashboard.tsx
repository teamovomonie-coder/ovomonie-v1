
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Wallet, Search, PieChart, Info, CheckCircle, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';


const MtnLogo = () => <div className="w-6 h-6 rounded-full bg-[#FFCC00] flex items-center justify-center"><span className="text-[#004A99] font-bold text-xs">MTN</span></div>;
const ZenithLogo = () => <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">Z</div>;
const GtcoLogo = () => <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">GT</div>;
const DangoteLogo = () => <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">DC</div>;

const mockStocks = [
    { symbol: 'MTNN', name: 'MTN Nigeria', price: 215.50, change: 5.20, category: 'Telecom', Logo: MtnLogo },
    { symbol: 'ZENITHBANK', name: 'Zenith Bank', price: 35.80, change: -0.15, category: 'Banking', Logo: ZenithLogo },
    { symbol: 'GTCO', name: 'Guaranty Trust Holding', price: 38.00, change: 1.25, category: 'Banking', Logo: GtcoLogo },
    { symbol: 'DANGCEM', name: 'Dangote Cement', price: 350.00, change: -2.50, category: 'Industrial', Logo: DangoteLogo },
    { symbol: 'BUACEMENT', name: 'BUA Cement', price: 98.00, change: 0.50, category: 'Industrial', Logo: () => <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-xs">BUA</div> },
    { symbol: 'SEPLAT', name: 'Seplat Energy', price: 1500.00, change: 25.00, category: 'Oil & Gas', Logo: () => <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs">SE</div> },
];

const mockHoldings = [
    { symbol: 'MTNN', name: 'MTN Nigeria', quantity: 100, avgBuyPrice: 205.00, currentPrice: 215.50 },
    { symbol: 'GTCO', name: 'Guaranty Trust Holding', quantity: 500, avgBuyPrice: 35.00, currentPrice: 38.00 },
];

const tradeSchema = z.object({
  orderType: z.enum(['Market', 'Limit']),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  limitPrice: z.coerce.number().optional(),
}).refine(data => {
    return data.orderType === 'Limit' ? data.limitPrice && data.limitPrice > 0 : true;
}, { message: 'Limit price is required for limit orders.', path: ['limitPrice'] });

type TradeFormData = z.infer<typeof tradeSchema>;

function TradeDialog({ stock, onTrade }: { stock: typeof mockStocks[0], onTrade: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const form = useForm<TradeFormData>({
        resolver: zodResolver(tradeSchema),
        defaultValues: { orderType: 'Market', quantity: 0 },
    });
    
    const watchedOrderType = form.watch('orderType');
    const watchedQuantity = form.watch('quantity');

    const handleTrade = async (values: TradeFormData) => {
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 1500));
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
            setOpen(false);
            setIsSuccess(false);
            form.reset();
        }, 2000);
        onTrade({ ...values, stock });
    };
    
    const estimatedCost = useMemo(() => {
        const price = watchedOrderType === 'Limit' && form.getValues('limitPrice') ? form.getValues('limitPrice')! : stock.price;
        return (watchedQuantity || 0) * price;
    }, [watchedQuantity, watchedOrderType, stock.price, form]);
    
    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { form.reset(); setIsSuccess(false); } }}>
            <DialogTrigger asChild>
                <Button size="sm">Trade</Button>
            </DialogTrigger>
            <DialogContent>
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h3 className="text-xl font-bold">Order Placed Successfully</h3>
                        <p className="text-muted-foreground">Your order is being processed and you will be notified upon execution.</p>
                    </div>
                ) : (
                <>
                <DialogHeader>
                    <DialogTitle>Place a Trade Order for {stock.symbol}</DialogTitle>
                    <DialogDescription>Current Market Price: ₦{stock.price.toFixed(2)}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy">Buy</TabsTrigger>
                        <TabsTrigger value="sell">Sell</TabsTrigger>
                    </TabsList>
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
                                     <FormField control={form.control} name="quantity" render={({ field }) => (
                                        <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>
                                     )}/>
                                      {watchedOrderType === 'Limit' && (
                                         <FormField control={form.control} name="limitPrice" render={({ field }) => (
                                            <FormItem><FormLabel>Limit Price (₦)</FormLabel><FormControl><Input type="number" placeholder="e.g., 215.00" {...field} /></FormControl><FormMessage /></FormItem>
                                         )}/>
                                      )}
                                 </div>
                                 <Card className="bg-muted">
                                     <CardContent className="p-3 text-center">
                                         <p className="text-sm text-muted-foreground">Estimated Cost</p>
                                         <p className="text-lg font-bold">₦{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                     </CardContent>
                                 </Card>
                                 <DialogFooter>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Place Buy Order
                                    </Button>
                                 </DialogFooter>
                            </form>
                         </Form>
                    </TabsContent>
                    <TabsContent value="sell" className="pt-4">
                        <p className="text-center text-muted-foreground p-8">Sell functionality coming soon.</p>
                    </TabsContent>
                </Tabs>
                </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function StockTradingDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleTrade = (data: any) => {
    toast({
        title: "Order Submitted!",
        description: `Your order to buy ${data.quantity} units of ${data.stock.symbol} has been placed.`
    });
  }

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return mockStocks;
    return mockStocks.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const stockCategories: Record<string, typeof mockStocks> = useMemo(() => {
    return filteredStocks.reduce((acc, stock) => {
        (acc[stock.category] = acc[stock.category] || []).push(stock);
        return acc;
    }, {} as Record<string, typeof mockStocks>);
  }, [filteredStocks]);

  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...mockStocks].sort((a, b) => b.change - a.change);
    return {
        topGainers: sorted.slice(0, 3),
        topLosers: sorted.slice(-3).reverse(),
    };
  }, []);

  const { portfolioValue, todaysGainLoss, portfolioHoldings } = useMemo(() => {
    const value = mockHoldings.reduce((acc, h) => acc + (h.quantity * h.currentPrice), 0);
    const cost = mockHoldings.reduce((acc, h) => acc + (h.quantity * h.avgBuyPrice), 0);
    return {
        portfolioValue: value,
        todaysGainLoss: value - cost,
        portfolioHoldings: mockHoldings
    };
  }, []);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Stock Trading</h2>
        </div>

        <Tabs defaultValue="market" className="space-y-4">
            <TabsList>
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
            <TabsContent value="market" className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search stocks by name or symbol..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                 <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="text-green-500"/> Top Gainers</CardTitle></CardHeader>
                        <CardContent>
                           <Table>
                               <TableBody>
                                   {topGainers.map(stock => (
                                       <TableRow key={stock.symbol}>
                                           <TableCell className="font-semibold">{stock.symbol}</TableCell>
                                           <TableCell className="text-right">₦{stock.price.toFixed(2)}</TableCell>
                                           <TableCell className="text-right text-green-500 font-semibold">+{(stock.change / (stock.price - stock.change) * 100).toFixed(2)}%</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="text-red-500"/> Top Losers</CardTitle></CardHeader>
                        <CardContent>
                           <Table>
                               <TableBody>
                                   {topLosers.map(stock => (
                                       <TableRow key={stock.symbol}>
                                           <TableCell className="font-semibold">{stock.symbol}</TableCell>
                                           <TableCell className="text-right">₦{stock.price.toFixed(2)}</TableCell>
                                           <TableCell className="text-right text-red-500 font-semibold">{(stock.change / (stock.price - stock.change) * 100).toFixed(2)}%</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        </CardContent>
                    </Card>
                </div>
                {Object.entries(stockCategories).map(([category, stocks]) => (
                     <Card key={category}>
                        <CardHeader><CardTitle>{category}</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Change</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stocks.map((stock) => (
                                        <TableRow key={stock.symbol}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <stock.Logo />
                                                    <div>
                                                        <div>{stock.symbol}</div>
                                                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">₦{stock.price.toFixed(2)}</TableCell>
                                            <TableCell className={cn("text-right font-semibold", stock.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                               <TradeDialog stock={stock} onTrade={handleTrade} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </TabsContent>
            <TabsContent value="portfolio" className="space-y-4">
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Portfolio Value</CardTitle><PieChart className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦{portfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Today's P/L</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className={cn("text-2xl font-bold", todaysGainLoss >= 0 ? "text-green-500" : "text-red-500")}>{todaysGainLoss >= 0 ? '+' : ''}₦{todaysGainLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Buying Power</CardTitle><Wallet className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦1,250,345.00</div></CardContent></Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle>My Holdings</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Avg. Cost</TableHead>
                                    <TableHead className="text-right">Market Value</TableHead>
                                    <TableHead className="text-right">Total P/L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {portfolioHoldings.map(h => {
                                    const marketValue = h.quantity * h.currentPrice;
                                    const totalCost = h.quantity * h.avgBuyPrice;
                                    const profitLoss = marketValue - totalCost;
                                    return (
                                        <TableRow key={h.symbol}>
                                            <TableCell className="font-medium">{h.symbol}</TableCell>
                                            <TableCell className="text-right">{h.quantity}</TableCell>
                                            <TableCell className="text-right">₦{h.avgBuyPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₦{marketValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                            <TableCell className={cn("text-right font-semibold", profitLoss >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                {profitLoss >= 0 ? '+' : ''}₦{profitLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="watchlist">
                <Card className="text-center py-20">
                    <CardHeader>
                        <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Watchlist Coming Soon</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <p className="text-muted-foreground">This section will allow you to pin and track your favorite stocks.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
