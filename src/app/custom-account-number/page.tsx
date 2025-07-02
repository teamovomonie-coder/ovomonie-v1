import { AppShell } from "@/components/layout/app-shell";
import { AccountNumberCustomizer } from "@/components/custom-account-number/account-number-customizer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomAccountNumberPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Customize Your Account Number</CardTitle>
            <CardDescription>
              Use the last 10 digits of your phone number as your unique Ovomonie account number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountNumberCustomizer />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
