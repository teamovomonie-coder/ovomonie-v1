import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { Bell, CheckCircle, Eye, MessageCircle, QrCode } from "lucide-react";
import { ChatInterface } from '@/components/ai-assistant/chat-interface';

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <header className="flex items-center justify-between p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
            <AvatarFallback>P</AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm text-gray-500">Hi,</span>
            <h1 className="font-bold text-lg">PAAGO</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="hidden sm:flex items-center gap-1 text-sm font-semibold">
            <MessageCircle className="h-5 w-5" />
            SUPPORT
          </Link>
          <Link href="/scan-to-pay">
            <QrCode className="h-6 w-6" />
          </Link>
          <div className="relative">
            <Bell className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-1.5 py-0.5 text-xs border-2 border-gray-50">13</Badge>
          </div>
        </div>
      </header>
      
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
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Available Balance</span>
                  </div>
                  <Link href="/" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Transaction History</span>
                  </Link>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-3xl font-bold">₦0.00</span>
                  <Button className="bg-white text-slate-800 hover:bg-gray-200 rounded-full">+ Add Money</Button>
                </div>
              </CardContent>
            </Card>
            <QuickAccess />
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