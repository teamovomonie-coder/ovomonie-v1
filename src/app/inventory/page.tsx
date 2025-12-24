import { AppShell } from "@/components/layout/app-shell";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";

export default function InventoryPage() {
  return (
    <AppShell>
      <InventoryDashboard />
    </AppShell>
  );
}
