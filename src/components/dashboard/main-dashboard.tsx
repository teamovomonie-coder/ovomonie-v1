"use client";

import CustomLink from '@/components/layout/custom-link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { ChatInterface } from '@/components/ai-assistant/chat-interface';
import { PromotionalCarousel } from '@/components/dashboard/promotional-carousel';
import { AgentLifeCard } from '@/components/dashboard/agent-life-card';
import { VirtualAccountWidget } from '@/components/dashboard/virtual-account-widget';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainDashboard() {
  const { balance } = useAuth();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  return (
    <div className="px-4 md:px-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/70 p-1 shadow-inner">
          <TabsTrigger value="dashboard" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            AI Assistant
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl rounded-3xl my-4 border-none">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="absolute right-4 bottom-6 h-32 w-32 rounded-full bg-primary-foreground/15 blur-3xl" />
            </div>
            <CardContent className="relative p-5 md:p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs text-primary-foreground/80">
                    <span className="uppercase tracking-[0.2em] text-[11px]">Available Balance</span>
                    <CustomLink href="/statements" className="text-[11px] font-semibold flex items-center gap-1 underline-offset-4 hover:underline">
                        Transaction History <ArrowRight className="h-3 w-3" />
                    </CustomLink>
                </div>
                <div className="flex items-end justify-between gap-4 flex-nowrap min-w-0">
                    <div className="flex items-center gap-3 min-w-[160px] flex-1">
                        <div className="text-lg font-semibold tracking-tight truncate tabular-nums">
                            {balance === null ? (
                            <Skeleton className="h-8 w-32 bg-primary-foreground/20" />
                            ) : isBalanceVisible ? (
                            new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(balance / 100)
                            ) : (
                            '******'
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20 flex-shrink-0" onClick={() => setIsBalanceVisible(!isBalanceVisible)}>
                            {isBalanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <CustomLink
                      href="/add-money"
                      className="group inline-flex items-center gap-1.5 bg-white text-primary text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md shadow-black/10 transition hover:translate-y-[-1px] hover:shadow-lg hover:bg-primary-foreground/90 hover:text-primary-foreground"
                    >
                      <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Add Money
                    </CustomLink>
                </div>
            </CardContent>
          </Card>
          <QuickAccess />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <VirtualAccountWidget />
            <div className="space-y-4">
              <PromotionalCarousel />
            </div>
          </div>
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
