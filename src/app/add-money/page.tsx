import { AppShell } from "@/components/layout/app-shell";
import { AddMoneyOptions } from "@/components/add-money/add-money-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddMoneyPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Add Money</CardTitle>
            <CardDescription>
              Choose your preferred method to fund your Ovomonie wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddMoneyOptions />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
