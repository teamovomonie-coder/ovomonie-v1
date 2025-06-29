import { AppShell } from "@/components/layout/app-shell";
import { WithdrawForm } from "@/components/withdraw/withdraw-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WithdrawPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-3xl mx-auto">
           <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>
              Choose your preferred method to withdraw money from your Ovomonie account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WithdrawForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
