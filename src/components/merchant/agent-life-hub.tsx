
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { HandCoins, Monitor, CheckCircle, Award, TrendingUp, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data based on the API response structure
const mockAgentData = {
  points: 12500,
  cashEquivalent: 12500,
  progress: {
    amount: 150000,
    transactions: 15,
    targetAmount: 300000,
    targetTransactions: 20,
  },
  devices: [
    { id: 'POS-001', serialNumber: 'SN-A987B1', status: 'Active', lastSync: '2 mins ago' },
    { id: 'POS-003', serialNumber: 'SN-E678F3', status: 'Active', lastSync: '5 mins ago' },
  ],
  tier: 'Gold',
};

function DailyProgress({ progress }: { progress: typeof mockAgentData.progress }) {
  const amountPercent = Math.min(100, (progress.amount / progress.targetAmount) * 100);
  const txnPercent = Math.min(100, (progress.transactions / progress.targetTransactions) * 100);
  const isQualified = amountPercent >= 100 && txnPercent >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
        <CardDescription>Your progress towards qualifying for today's AgentLife points.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span>Transaction Value</span>
            <span>₦{progress.amount.toLocaleString()} / ₦{progress.targetAmount.toLocaleString()}</span>
          </div>
          <Progress value={amountPercent} />
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span>Transaction Count</span>
            <span>{progress.transactions} / {progress.targetTransactions}</span>
          </div>
          <Progress value={txnPercent} />
        </div>
        {isQualified && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <p className="font-semibold">Congratulations! You've qualified for today's points.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoanRequestModal({ cashEquivalent }: { cashEquivalent: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRequestLoan = async () => {
    const loanAmount = parseFloat(amount);
    if (isNaN(loanAmount) || loanAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid loan amount.' });
      return;
    }
    if (loanAmount > cashEquivalent) {
      toast({ variant: 'destructive', title: 'Insufficient Points', description: `You can request a loan up to ₦${cashEquivalent.toLocaleString()}.` });
      return;
    }

    setIsLoading(true);
    await new Promise(res => setTimeout(res, 1500));
    setIsLoading(false);
    setOpen(false);
    setAmount('');
    toast({
      title: 'Loan Request Successful',
      description: `Your loan of ₦${loanAmount.toLocaleString()} has been approved and disbursed. It will be deducted from your points.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full"><HandCoins className="mr-2 h-4 w-4" /> Request Agent Loan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request AgentLife Loan</DialogTitle>
          <DialogDescription>
            You can request a quick loan based on your available cash equivalent points. The interest rate is 2% flat, repayable within 30 days.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount (₦)</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`e.g., 5000`}
                />
            </div>
             <p className="text-sm text-muted-foreground">
                Max available for loan: <span className="font-bold text-primary">₦{cashEquivalent.toLocaleString()}</span>
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleRequestLoan} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function AgentLifeHub() {
    const [data, setData] = useState<typeof mockAgentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            setData(mockAgentData);
            setIsLoading(false);
        }, 1000);
    }, []);

    if (isLoading || !data) {
        return (
             <div className="p-4 space-y-4">
                <header className="bg-primary text-primary-foreground -mx-4 -mt-4 p-4 py-6 rounded-b-2xl shadow-lg">
                    <Skeleton className="h-8 w-48 bg-primary-foreground/20" />
                    <Skeleton className="h-4 w-64 mt-2 bg-primary-foreground/20" />
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
             </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            <header className="bg-primary text-primary-foreground -mx-4 -mt-4 p-4 py-6 rounded-b-2xl shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">AgentLife Hub</h2>
                <p className="text-primary-foreground/80 text-sm">Your gateway to rewards, loans, and performance tracking.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AgentLife Points</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.points.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total accumulated points</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash Equivalent</CardTitle>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{data.cashEquivalent.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available for loans or withdrawal</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agent Tier</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{data.tier}</div>
                        <p className="text-xs text-muted-foreground">Keep transacting to level up!</p>
                    </CardContent>
                </Card>
            </div>

            <DailyProgress progress={data.progress} />
            
             <Card>
                <CardHeader>
                    <CardTitle>My POS Devices</CardTitle>
                    <CardDescription>List of POS terminals assigned to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Sync</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.devices.map(device => (
                                <TableRow key={device.id}>
                                    <TableCell className="font-medium">{device.serialNumber}</TableCell>
                                    <TableCell><Badge className="bg-green-100 text-green-800">{device.status}</Badge></TableCell>
                                    <TableCell>{device.lastSync}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <LoanRequestModal cashEquivalent={data.cashEquivalent} />
        </div>
    );
}
