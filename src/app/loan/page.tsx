import { AppShell } from "@/components/layout/app-shell";
import { LoanDashboard } from "@/components/loan/loan-dashboard";

export default function LoanPage() {
  return (
    <AppShell>
      <LoanDashboard />
    </AppShell>
  );
}
