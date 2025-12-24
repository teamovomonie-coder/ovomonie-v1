'use client';

import { AppShell } from "@/components/layout/app-shell";
import InsuranceProducts from '@/components/features/insurance-products';

export default function InsurancePage() {
  return (
    <AppShell>
      <InsuranceProducts />
    </AppShell>
  );
}