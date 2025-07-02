
import { AppShell } from "@/components/layout/app-shell";
import { FrscLicenseFlow } from "@/components/frsc-license/frsc-license-flow";

export default function FrscLicensePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <FrscLicenseFlow />
      </div>
    </AppShell>
  );
}
