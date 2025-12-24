import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface DashboardStatsProps {
  balance: number;
  totalTransactions: number;
  kycTier: number;
  lastTransaction?: {
    amount: number;
    type: string;
    date: string;
  };
}

const DashboardStats = memo(({ balance, totalTransactions, kycTier, lastTransaction }: DashboardStatsProps) => {
  const formattedBalance = useMemo(() => formatCurrency(balance), [balance]);
  
  const tierLimits = useMemo(() => {
    const limits = {
      1: { daily: 50000, monthly: 200000 },
      2: { daily: 500000, monthly: 2000000 },
      3: { daily: 5000000, monthly: 20000000 },
      4: { daily: Infinity, monthly: Infinity }
    };
    return limits[kycTier as keyof typeof limits] || limits[1];
  }, [kycTier]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedBalance}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">KYC Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Tier {kycTier}</div>
          <p className="text-xs text-muted-foreground">
            Daily limit: {tierLimits.daily === Infinity ? 'Unlimited' : formatCurrency(tierLimits.daily)}
          </p>
        </CardContent>
      </Card>
      
      {lastTransaction && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(lastTransaction.amount)}</div>
            <p className="text-xs text-muted-foreground">
              {lastTransaction.type} • {new Date(lastTransaction.date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;