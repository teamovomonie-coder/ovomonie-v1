
import { AppShell } from "@/components/layout/app-shell";
import { ProfileKycDashboard } from "@/components/profile/profile-kyc-dashboard";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <ProfileKycDashboard />
      </div>
    </AppShell>
  );
}
