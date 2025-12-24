'use client';

import { AppShell } from "@/components/layout/app-shell";
import SavingsGoals from '@/components/features/savings-goals';

export default function SavingsGoalsPage() {
  return (
    <AppShell>
      <SavingsGoals />
    </AppShell>
  );
}