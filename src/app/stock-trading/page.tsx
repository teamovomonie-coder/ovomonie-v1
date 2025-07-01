import { AppShell } from "@/components/layout/app-shell";
import { StockTradingDashboard } from "@/components/stock-trading/stock-trading-dashboard";

export default function StockTradingPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <StockTradingDashboard />
      </div>
    </AppShell>
  );
}
