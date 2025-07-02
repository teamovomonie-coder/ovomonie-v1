
import { AppShell } from "@/components/layout/app-shell";
import { NINRegistrationFlow } from "@/components/nin-registration/nin-registration-flow";

export default function NINRegistrationPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <NINRegistrationFlow />
      </div>
    </AppShell>
  );
}
