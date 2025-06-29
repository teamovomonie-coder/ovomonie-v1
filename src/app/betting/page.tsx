import { AppShell } from "@/components/layout/app-shell";
import { BettingForm } from "@/components/betting/betting-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BettingPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Fund Betting Account</CardTitle>
            <CardDescription>
              Quickly and securely fund your favorite betting wallets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BettingForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
