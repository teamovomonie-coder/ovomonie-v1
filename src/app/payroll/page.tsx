import { AppShell } from "@/components/layout/app-shell";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";

export default function PayrollPage() {
  return (
    <AppShell>
      <PayrollDashboard />
    </AppShell>
  );
}
