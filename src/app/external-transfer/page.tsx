import { AppShell } from "@/components/layout/app-shell";
import { ExternalTransferForm } from "@/components/external-transfer/external-transfer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExternalTransferPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Send Money to another Bank</CardTitle>
            <CardDescription>
              Transfer funds to any Nigerian bank account securely and instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalTransferForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
