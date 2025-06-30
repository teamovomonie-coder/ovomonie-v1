import { AppShell } from "@/components/layout/app-shell";
import { InternalTransferForm } from "@/components/internal-transfer/internal-transfer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InternalTransferPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Send to Ovomonie User</CardTitle>
            <CardDescription>
              Transfer funds instantly to any Ovomonie account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InternalTransferForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
