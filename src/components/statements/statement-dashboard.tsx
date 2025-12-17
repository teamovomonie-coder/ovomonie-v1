
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  category: 'transfer' | 'bill' | 'airtime' | 'pos' | 'deposit' | 'withdrawal' | 'investment' | 'loan';
  type: 'debit' | 'credit';
  amount: number;
  reference: string;
  narration: string;
  party: any;
  timestamp: string;
}

const chartConfig = {
  debits: { label: "Debits", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function StatementDashboard() {
  const { toast } = useToast();
  const { balance } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const filterTypes = [
    { value: 'all', label: 'All' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'bill', label: 'Bills' },
    { value: 'airtime', label: 'Airtime' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            const response = await fetch('/api/transactions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch transactions');
            }
            const result = await response.json();
            setTransactions(result.success ? result.data : []);
        } catch (error) {
            if (error instanceof Error) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }
    fetchTransactions();
  }, [toast]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const inDateRange = dateRange?.from && dateRange?.to 
        ? txDate >= dateRange.from && txDate <= dateRange.to
        : true;
      
      // Bill filter includes bill_payment, airtime, betting, data
      const matchesType = filterType === 'all' || 
        (filterType === 'bill' ? ['bill_payment', 'airtime', 'betting', 'data'].includes(tx.category) : tx.category === filterType);
      
      const matchesSearch = searchQuery === '' ||
        tx.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase());

      return inDateRange && matchesType && matchesSearch;
    });
  }, [transactions, dateRange, filterType, searchQuery]);

  const { totalCredits, totalDebits, chartData } = useMemo(() => {
    let credits = 0;
    let debits = 0;
    const categorySpending: { [key: string]: number } = {};

    filteredTransactions.forEach(tx => {
      if (tx.type === 'credit') {
        credits += tx.amount;
      } else {
        debits += tx.amount;
        const category = tx.category;
        categorySpending[category] = (categorySpending[category] || 0) + tx.amount;
      }
    });

    const chartData = Object.entries(categorySpending).map(([name, total]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      debits: total/100, // convert from kobo
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
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 select-none">
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">Account Statement</CardTitle>
            <CardDescription>Filter, review, and export your transactions.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleExport('PDF')}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}>
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('CSV')}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <div className="flex flex-wrap gap-2">
            {filterTypes.map((type) => (
              <Badge
                key={type.value}
                variant={filterType === type.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1 text-xs",
                  filterType === type.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
                onClick={() => setFilterType(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by name or reference..." className="pl-10 select-text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Chronological log of your account activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
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
                    {filteredTransactions.map((tx, idx) => (
                      <TableRow key={tx.id} className={cn(idx % 2 === 0 ? 'bg-muted/30' : 'bg-white')}>
                        <TableCell>
                          <p className="font-medium">{tx.narration}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.timestamp), 'dd MMM, yyyy, h:mm a')}</p>
                        </TableCell>
                         <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="capitalize">{tx.category}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{tx.reference}</TableCell>
                        <TableCell className={cn(`text-right font-bold`, tx.type === 'credit' ? 'text-green-600' : 'text-foreground')}>
                          {tx.type === 'credit' ? '+' : '-'}₦{(tx.amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
              {filteredTransactions.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No transactions found for the selected criteria.</p>
                  </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
