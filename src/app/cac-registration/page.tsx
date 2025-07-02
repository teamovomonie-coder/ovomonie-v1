import { AppShell } from "@/components/layout/app-shell";
import { CacRegistrationFlow } from "@/components/cac-registration/cac-registration-flow";

export default function CacRegistrationPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <CacRegistrationFlow />
      </div>
    </AppShell>
  );
}
