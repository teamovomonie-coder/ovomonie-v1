
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { ChatInterface } from '@/components/ai-assistant/chat-interface';
import { AgentLifeCard } from '@/components/dashboard/agent-life-card';

export function MainDashboard() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <main className="px-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200 rounded-lg p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md">Dashboard</TabsTrigger>
            <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md">AI Assistant</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Card className="bg-slate-800 text-white shadow-lg rounded-2xl my-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span>Available Balance</span>
                   <Link href="/add-money" className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">+ Add Money</Link>
                </div>
                <div className="text-3xl font-bold mt-2">
                  ₦1,250,345.00
                </div>
              </CardContent>
            </Card>
            <QuickAccess />
            <AgentLifeCard />
          </TabsContent>
          <TabsContent value="ai-assistant">
             <Card className="h-[calc(100vh-14rem)] flex flex-col mt-4">
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
