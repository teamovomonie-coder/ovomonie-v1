import { AppShell } from "@/components/layout/app-shell";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { Recommendations } from "@/components/dashboard/recommendations";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <OverviewCard />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RecentTransactions />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <QuickAccess />
            <Recommendations />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
