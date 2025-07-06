

import { AppShell } from "@/components/layout/app-shell";
import { ExternalTransferForm } from "@/components/external-transfer/external-transfer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MemoTransferPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>MemoTransfer</CardTitle>
            <CardDescription>
              Send personalized money transfers with AI-generated images and custom messages to any bank account in Nigeria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalTransferForm defaultMemo={true} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
