
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { ChatInterface } from '@/components/ai-assistant/chat-interface';
import { PromotionalCarousel } from '@/components/dashboard/promotional-carousel';
import { AgentLifeCard } from '@/components/dashboard/agent-life-card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainDashboard() {
  const { balance } = useAuth();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  return (
    <div className="px-4">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Card className="bg-primary text-primary-foreground shadow-lg rounded-2xl my-4">
            <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm text-primary-foreground/80">
                    <span>Available Balance</span>
                    <Link href="/statements" className="text-xs font-semibold flex items-center gap-1">
                        Transaction History <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                            {balance === null ? (
                            <Skeleton className="h-8 w-48 bg-primary-foreground/20" />
                            ) : isBalanceVisible ? (
                            new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(balance / 100)
                            ) : (
                            '******'
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsBalanceVisible(!isBalanceVisible)}>
                            {isBalanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <Link href="/add-money" className="bg-primary-foreground/20 text-white text-xs font-semibold px-3 py-1 rounded-full">+ Add Money</Link>
                </div>
            </CardContent>
          </Card>
          <QuickAccess />
          <PromotionalCarousel />
          <AgentLifeCard />
        </TabsContent>
        <TabsContent value="ai-assistant" className="mt-4">
           <Card className="h-[calc(100vh-14rem)] flex flex-col">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Ask me anything about your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ChatInterface />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
