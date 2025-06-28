import { AppShell } from "@/components/layout/app-shell";
import { ChatInterface } from "@/components/ai-assistant/chat-interface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiAssistantPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="h-[calc(100vh-5rem)] flex flex-col">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
              Ask me anything about your account in English, Hausa, Yoruba, or Igbo.
              For example: "What is my account balance?"
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ChatInterface />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
