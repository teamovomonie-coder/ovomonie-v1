"use client";

import CustomLink from '@/components/layout/custom-link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export function AgentLifeCard() {
  return (
    <CustomLink href="/agent-life" className="block my-4">
      <Card className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0b1a3a] via-[#0f2f63] to-[#0a56ff] text-white shadow-xl transition hover:shadow-2xl">
        {/* Stripe-like overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0,rgba(255,255,255,0.16)_35%,transparent_35%,transparent_65%)] bg-[length:220px_220px]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-16 -bottom-12 h-40 w-40 rounded-full bg-[#0018ff]/30 blur-3xl" />
        </div>

        <CardContent className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/15 p-2 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/75">AgentLife</p>
              <h3 className="text-xl font-bold leading-tight sm:text-2xl">Merchant Services</h3>
              <p className="text-sm text-white/80">Earn, finance, and settle faster with Ovomonie’s agent stack.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right text-sm font-semibold text-white/85">
              <span className="inline-flex items-center gap-1 justify-end">
                <Sparkles className="h-4 w-4 text-amber-200" /> 2% Agent Loans
              </span>
              <span className="text-white/70 text-xs">Access perks & analytics</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur-sm transition group-hover:bg-white/20">
              Access Dashboard <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </CustomLink>
  );
}
