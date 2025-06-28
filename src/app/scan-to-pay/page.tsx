import { AppShell } from "@/components/layout/app-shell";
import { ScannerUI } from "@/components/scan-to-pay/scanner-ui";

export default function ScanToPayPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <ScannerUI />
      </div>
    </AppShell>
  );
}
