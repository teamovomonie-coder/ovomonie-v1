import { AppShell } from "@/components/layout/app-shell";
import { VoterRegistrationFlow } from "@/components/voter-registration/voter-registration-flow";

export default function VoterRegistrationPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <VoterRegistrationFlow />
      </div>
    </AppShell>
  );
}
