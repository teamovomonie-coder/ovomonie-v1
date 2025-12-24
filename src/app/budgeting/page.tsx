'use client';

import { AppShell } from "@/components/layout/app-shell";
import BudgetingTools from '@/components/features/budgeting-tools';

export default function BudgetingPage() {
  return (
    <AppShell>
      <BudgetingTools />
    </AppShell>
  );
}