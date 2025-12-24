'use client';

import { AppShell } from "@/components/layout/app-shell";
import CryptoTrading from '@/components/features/crypto-trading';

export default function CryptoTradingPage() {
  return (
    <AppShell>
      <CryptoTrading />
    </AppShell>
  );
}