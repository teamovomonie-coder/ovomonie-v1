import { AppShell } from "@/components/layout/app-shell";
import { FashionDealsFlow } from "@/components/fashion-deals/fashion-deals-flow";

export default function FashionDealsPage() {
  return (
    <AppShell>
      <div className="flex-1 p-0 sm:p-4">
        <FashionDealsFlow />
      </div>
    </AppShell>
  );
}
