import { AppShell } from "@/components/layout/app-shell";
import { TransferForm } from "@/components/memo-transfer/transfer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MemoTransferPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>MemoTransfer</CardTitle>
            <CardDescription>
              Make every transfer memorable. Add a photo and a message to your receipt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
