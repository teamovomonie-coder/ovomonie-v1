import { AppShell } from "@/components/layout/app-shell";
import { ShoppingFlow } from "@/components/online-shopping/shopping-flow";

export default function OnlineShoppingPage() {
  return (
    <AppShell>
      <div className="flex-1 p-0 sm:p-4">
        <ShoppingFlow />
      </div>
    </AppShell>
  );
}
