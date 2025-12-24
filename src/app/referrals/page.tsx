'use client';

import { AppShell } from "@/components/layout/app-shell";
import ReferralProgram from '@/components/features/referral-program';

export default function ReferralsPage() {
  return (
    <AppShell>
      <ReferralProgram />
    </AppShell>
  );
}