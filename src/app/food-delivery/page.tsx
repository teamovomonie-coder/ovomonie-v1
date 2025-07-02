import { AppShell } from "@/components/layout/app-shell";
import { FoodDeliveryFlow } from "@/components/food-delivery/food-delivery-flow";

export default function FoodDeliveryPage() {
  return (
    <AppShell>
      <div className="flex-1 p-0 sm:p-4">
        <FoodDeliveryFlow />
      </div>
    </AppShell>
  );
}
