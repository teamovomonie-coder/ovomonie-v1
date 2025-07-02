
"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// Icons
import { Download, Search, FileText, ArrowUp, ArrowDown } from 'lucide-react';

// Mock Data
import { mockTransactions, Transaction } from '@/lib/statement-data';

const chartConfig = {
  credits: { label: "Credits", color: "hsl(var(--chart-1))" },
  debits: { label: "Debits", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function StatementDashboard() {
  const { toast } = useToast();
  const [transactions] = useState<Transaction[]>(mockTransactions);
  
  // Filtering states
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      const inDateRange = dateRange?.from && dateRange?.to 
        ? txDate >= dateRange.from && txDate <= dateRange.to
        : true;
      
      const matchesType = filterType === 'all' || tx.type === filterType;
      
      const matchesSearch = searchQuery === '' ||
        tx.beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.memo && tx.memo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase());

      return inDateRange && matchesType && matchesSearch;
    });
  }, [transactions, dateRange, filterType, searchQuery]);

  const { totalCredits, totalDebits, chartData } = useMemo(() => {
    let credits = 0;
    let debits = 0;
    const categorySpending: { [key: string]: number } = {};

    filteredTransactions.forEach(tx => {
      if (tx.amount > 0) {
        credits += tx.amount;
      } else {
        debits += Math.abs(tx.amount);
        const category = tx.type;
        categorySpending[category] = (categorySpending[category] || 0) + Math.abs(tx.amount);
      }
    });

    const chartData = Object.entries(categorySpending).map(([name, total]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      debits: total,
    })).sort((a,b) => b.debits - a.debits);
    
    return { totalCredits: credits, totalDebits: debits, chartData };
  }, [filteredTransactions]);

  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    toast({
        title: "Exporting Statement",
        description: `Your statement is being generated in ${format} format and will be downloaded shortly.`,
    })
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Account Statement</h2>
         <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('PDF')}><Download className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">PDF</span></Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}><Download className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Excel</span></Button>
            <Button variant="outline" onClick={() => handleExport('CSV')}><Download className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">CSV</span></Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Current Balance</CardTitle><FileText className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦1,250,345.00</div><p className="text-xs text-muted-foreground">As of today</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Credits</CardTitle><ArrowUp className="h-4 w-4 text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">+₦{totalCredits.toLocaleString(undefined, {minimumFractionDigits: 2})}</div><p className="text-xs text-muted-foreground">For selected period</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Debits</CardTitle><ArrowDown className="h-4 w-4 text-red-500"/></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">-₦{totalDebits.toLocaleString(undefined, {minimumFractionDigits: 2})}</div><p className="text-xs text-muted-foreground">For selected period</p></CardContent></Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Spending Summary</CardTitle></CardHeader>
            <CardContent className="h-[60px] pb-0">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart layout="vertical" data={chartData.slice(0, 3)} margin={{left: -20, right: 0, top: 0, bottom: 0}}>
                        <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" hide />
                        <Bar dataKey="debits" layout="vertical" fill="var(--color-debits)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>A detailed log of all your account activities.</CardDescription>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                  <SelectItem value="bill">Bill Payments</SelectItem>
                  <SelectItem value="airtime">Airtime</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 <Input placeholder="Search..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Details</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <p className="font-medium">{tx.beneficiary.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'dd MMM, yyyy, h:mm a')}</p>
                    </TableCell>
                     <TableCell className="hidden sm:table-cell"><Badge variant="outline">{tx.type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{tx.reference}</TableCell>
                    <TableCell className={`text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}₦{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {filteredTransactions.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>No transactions found for the selected criteria.</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
