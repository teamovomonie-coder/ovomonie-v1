
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  party: {
    name: string;
  };
  timestamp: string;
}

function TransactionItem({ type, name, amount, date }: { type: 'debit' | 'credit', name: string, amount: number, date: string }) {
    const isCredit = type === 'credit';
    const Icon = isCredit ? ArrowDown : ArrowUp;
    
    return (
        <div className="flex items-center gap-4 py-3">
            <div className={cn("p-2 rounded-full", isCredit ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50')}>
                <Icon className={cn("h-5 w-5", isCredit ? 'text-green-600' : 'text-red-600')} />
            </div>
            <div className="flex-1">
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(date), "MMM d, yyyy")}</p>
            </div>
            <div className={cn("font-bold", isCredit ? 'text-green-600' : 'text-foreground')}>
                {isCredit ? '+' : '-'}₦{(amount / 100).toLocaleString()}
            </div>
        </div>
    )
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTransactions(data.slice(0, 2));
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  return (
    <Card className="my-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/statements">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-1/4" />
            </div>
             <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-1/4" />
            </div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y">
            {transactions.map(tx => (
                <TransactionItem 
                    key={tx.id}
                    type={tx.type}
                    name={tx.party.name}
                    amount={tx.amount}
                    date={tx.timestamp}
                />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No recent transactions found.</p>
        )}
      </CardContent>
    </Card>
  );
}
