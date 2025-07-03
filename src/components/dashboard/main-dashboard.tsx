
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { ChatInterface } from '@/components/ai-assistant/chat-interface';
import { AgentLifeCard } from '@/components/dashboard/agent-life-card';

export function MainDashboard() {
  return (
    <div className="bg-background min-h-screen font-sans text-foreground">
      <main className="px-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
            <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Assistant</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Card className="bg-primary text-primary-foreground shadow-lg rounded-2xl my-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-sm text-primary-foreground/80">
                  <span>Available Balance</span>
                   <Link href="/add-money" className="bg-primary-foreground/20 text-white text-xs font-semibold px-3 py-1 rounded-full">+ Add Money</Link>
                </div>
                <div className="text-3xl font-bold mt-2">
                  ₦1,250,345.00
                </div>
              </CardContent>
            </Card>
            <QuickAccess />
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
      </main>
    </div>
  );
}
