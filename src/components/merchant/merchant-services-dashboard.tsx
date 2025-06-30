"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Monitor, UserCheck, Users, BarChart } from "lucide-react";

export function MerchantServicesDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Merchant Services</h2>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terminals">Terminals</TabsTrigger>
          <TabsTrigger value="agentlife">AgentLife Hub</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Business Wallet</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦5,432,100.50</div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦1,200,000.00</div>
                <p className="text-xs text-muted-foreground">To be settled tomorrow</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Terminals</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 / 5</div>
                <p className="text-xs text-muted-foreground">Online Terminals</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AgentLife Tier</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gold</div>
                <p className="text-xs text-muted-foreground">1,250 Points</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Merchant Services</CardTitle>
              <CardDescription>This is your command center. Manage everything from sales to staff here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>More dashboard widgets and summaries will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="terminals">
             <Card>
                <CardHeader><CardTitle>Terminal Management</CardTitle></CardHeader>
                <CardContent><p>A list of your POS terminals, their status, and management options will appear here.</p></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="agentlife">
            <Card>
                <CardHeader><CardTitle>AgentLife Hub</CardTitle></CardHeader>
                <CardContent><p>Your AgentLife tier, commission leaderboards, and points balance will be displayed here.</p></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="staff">
             <Card>
                <CardHeader><CardTitle>Staff Management</CardTitle></CardHeader>
                <CardContent><p>Tools to add staff/cashiers, assign terminals, and manage permissions will be available here.</p></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="analytics">
             <Card>
                <CardHeader><CardTitle>Business Analytics</CardTitle></CardHeader>
                <CardContent><p>Sales graphs, customer trends, and settlement reports will be available here.</p></CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
