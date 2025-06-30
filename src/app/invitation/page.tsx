import { AppShell } from "@/components/layout/app-shell";
import { InvitationDashboard } from "@/components/invitation/invitation-dashboard";

export default function InvitationPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <InvitationDashboard />
      </div>
    </AppShell>
  );
}
