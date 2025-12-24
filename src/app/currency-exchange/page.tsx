'use client';

import { AppShell } from "@/components/layout/app-shell";
import CurrencyExchange from '@/components/features/currency-exchange';

export default function CurrencyExchangePage() {
  return (
    <AppShell>
      <CurrencyExchange />
    </AppShell>
  );
}