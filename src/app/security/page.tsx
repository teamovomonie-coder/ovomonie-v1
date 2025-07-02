
import { AppShell } from "@/components/layout/app-shell";
import { SecurityDashboard } from "@/components/security/security-dashboard";

export default function SecurityPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <SecurityDashboard />
      </div>
    </AppShell>
  );
}
