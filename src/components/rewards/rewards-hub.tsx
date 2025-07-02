"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Award, Gift, Gem, Shield, Crown, TrendingUp, DollarSign, Percent, Zap, Ticket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// Mock Data
const userPoints = {
  total: 12500,
  cashEquivalent: 125.00,
};

const loyaltyTiers = [
  { name: 'Bronze', pointsRequired: 0, icon: Shield, color: 'text-yellow-600' },
  { name: 'Silver', pointsRequired: 5000, icon: Award, color: 'text-gray-400' },
  { name: 'Gold', pointsRequired: 20000, icon: Gem, color: 'text-yellow-500' },
  { name: 'Platinum', pointsRequired: 100000, icon: Crown, color: 'text-blue-400' },
];

const dailyOffers = [
  { id: 'offer-1', title: '5% Cashback', description: 'On your next airtime purchase.', icon: Percent },
  { id: 'offer-2', title: '100 Bonus Points', description: 'When you pay a utility bill today.', icon: Zap },
  { id: 'offer-3', title: 'Free Movie Ticket', description: 'When you spend ₦10,000 on shopping.', icon: Ticket },
];

const pointsHistory = [
  { id: 'hist-1', description: 'Welcome Bonus', points: 500, type: 'credit', date: '2024-07-28' },
  { id: 'hist-2', description: 'Airtime Purchase Reward', points: 50, type: 'credit', date: '2024-07-29' },
  { id: 'hist-3', description: 'Redeemed for Airtime', points: -1000, type: 'debit', date: '2024-07-30' },
  { id: 'hist-4', description: 'Referral Bonus (J. Doe)', points: 500, type: 'credit', date: '2024-07-31' },
  { id: 'hist-5', description: 'Daily Offer Claimed', points: 100, type: 'credit', date: '2024-08-01' },
];

const getCurrentTier = (points: number) => {
  let currentTier = loyaltyTiers[0];
  for (const tier of loyaltyTiers) {
    if (points >= tier.pointsRequired) {
      currentTier = tier;
    } else {
      break;
    }
  }
  return currentTier;
};

const getNextTier = (points: number) => {
    const currentTierIndex = loyaltyTiers.findIndex(t => t.name === getCurrentTier(points).name);
    return loyaltyTiers[currentTierIndex + 1] || null;
}

export function RewardsHub() {
  const { toast } = useToast();
  const currentTier = getCurrentTier(userPoints.total);
  const nextTier = getNextTier(userPoints.total);

  const progressToNextTier = nextTier
    ? ((userPoints.total - currentTier.pointsRequired) / (nextTier.pointsRequired - currentTier.pointsRequired)) * 100
    : 100;

  const handleClaimOffer = (title: string) => {
      toast({
          title: "Offer Claimed!",
          description: `You have successfully claimed the "${title}" offer.`,
      })
  }
  
  const handleRedeemPoints = () => {
    toast({
      title: "Redemption Coming Soon!",
      description: "You'll be able to redeem your points for cash, airtime, and more soon.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Rewards Hub</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Points</CardTitle>
            <CardDescription>Your accumulated loyalty points.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="text-center bg-muted p-4 rounded-lg">
                <p className="text-4xl font-bold text-primary">{userPoints.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Points</p>
            </div>
            <p className="text-center text-sm">
                Cash Equivalent: <span className="font-bold">₦{userPoints.cashEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </p>
          </CardContent>
           <CardFooter>
                <Button className="w-full" onClick={handleRedeemPoints}>Redeem Points</Button>
            </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Loyalty Tier</CardTitle>
            <CardDescription>The more you transact, the higher your tier and rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <currentTier.icon className={cn("h-12 w-12", currentTier.color)} />
                <div>
                    <p className="text-2xl font-bold">{currentTier.name} Member</p>
                    {nextTier ? (
                         <p className="text-sm text-muted-foreground">
                            {nextTier.pointsRequired - userPoints.total} points to reach {nextTier.name}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">You are at the highest tier!</p>
                    )}
                </div>
            </div>
             {nextTier && <Progress value={progressToNextTier} />}
            <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Benefits:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Increased transaction limits</li>
                    <li>Priority customer support</li>
                    <li>Exclusive offers and discounts</li>
                    {currentTier.name !== 'Bronze' && <li>Lower fees on certain services</li>}
                    {currentTier.name === 'Gold' || currentTier.name === 'Platinum' ? <li>Dedicated relationship manager</li> : null}
                </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Offers</CardTitle>
                    <CardDescription>Claim these special offers available just for you today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {dailyOffers.map(offer => (
                        <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <offer.icon className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="font-semibold">{offer.title}</p>
                                    <p className="text-xs text-muted-foreground">{offer.description}</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleClaimOffer(offer.title)}>Claim</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Invite & Earn</CardTitle>
                    <CardDescription>Get rewarded for every friend you bring to Ovomonie.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                     <Gift className="mx-auto h-12 w-12 text-primary mb-4" />
                    <p className="font-bold text-lg">Earn ₦500 for each successful referral!</p>
                </CardContent>
                 <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/invitation">Go to Invitation Hub</Link>
                    </Button>
                 </CardFooter>
            </Card>
        </div>


      <Tabs defaultValue="history">
        <TabsList><TabsTrigger value="history">Points History</TabsTrigger></TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>A log of your points transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Points</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {pointsHistory.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                </TableCell>
                                <TableCell className={cn("text-right font-bold", item.type === 'credit' ? 'text-green-600' : 'text-destructive')}>
                                    {item.type === 'credit' ? '+' : ''}{item.points.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
