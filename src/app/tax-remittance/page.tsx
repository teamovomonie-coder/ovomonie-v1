
import { AppShell } from "@/components/layout/app-shell";
import { TaxDashboard } from "@/components/tax-remittance/tax-dashboard";

export default function TaxRemittancePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <TaxDashboard />
      </div>
    </AppShell>
  );
}
