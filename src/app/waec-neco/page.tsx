
import { AppShell } from "@/components/layout/app-shell";
import { WaecNecoPortal } from "@/components/waec-neco/waec-neco-portal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function WaecNecoPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>WAEC & NECO Services</CardTitle>
                <CardDescription>Purchase examination PINs and check results instantly.</CardDescription>
            </CardHeader>
            <CardContent>
                <WaecNecoPortal />
            </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
