import { AppShell } from "@/components/layout/app-shell";
import { CardCustomizer } from "@/components/custom-card/card-customizer";

export default function CustomCardPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
          <CardCustomizer />
      </div>
    </AppShell>
  );
}
