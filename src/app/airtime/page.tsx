import { AppShell } from "@/components/layout/app-shell";
import { AirtimeForm } from "@/components/airtime/airtime-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AirtimePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Airtime & Data</CardTitle>
            <CardDescription>
              Recharge any Nigerian phone number with airtime or data bundles quickly and securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AirtimeForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
