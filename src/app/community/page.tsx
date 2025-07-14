
import { AppShell } from "@/components/layout/app-shell";
import { CommunityHub } from "@/components/community/community-hub";

export default function CommunityPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <CommunityHub />
      </div>
    </AppShell>
  );
}
