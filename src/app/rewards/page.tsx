import { AppShell } from "@/components/layout/app-shell";
import { RewardsHub } from "@/components/rewards/rewards-hub";

export default function RewardsPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <RewardsHub />
      </div>
    </AppShell>
  );
}
