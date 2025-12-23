'use client';

import { AppShell } from "@/components/layout/app-shell";
import LoyaltyProgram from '@/components/features/loyalty-program';

export default function LoyaltyPage() {
  return (
    <AppShell>
      <LoyaltyProgram />
    </AppShell>
  );
}