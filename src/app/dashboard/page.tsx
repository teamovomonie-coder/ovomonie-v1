
"use client";

import { AppShell } from "@/components/layout/app-shell";
import { MainDashboard } from "@/components/dashboard/main-dashboard";

export default function DashboardPage() {
  return (
    <AppShell>
      <MainDashboard />
    </AppShell>
  );
}
