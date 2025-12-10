"use client";

import CustomLink from "@/components/layout/custom-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Clock3 } from "lucide-react";

export function ComingSoonInventory() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-white px-4 py-12 text-slate-900">
      <Card className="relative w-full max-w-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-6 h-20 w-20 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-slate-200 blur-3xl animate-pulse" />
        </div>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slate-700 animate-bounce" />
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-[0.2em] text-[10px]">
              Coming Soon
            </Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold leading-tight">
            Inventory is under construction
          </CardTitle>
          <CardDescription className="text-slate-600 text-base">
            We&apos;re building a streamlined inventory experience for agents and SMEs—live sync, clean controls, and secure exports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">What to expect</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc list-inside">
              <li>Multi-location stock with real-time sync</li>
              <li>Audit-friendly logs and secure approvals</li>
              <li>Simple exports for reconciliation</li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <CustomLink href="/dashboard" className="flex items-center gap-2">
                Back to dashboard <ArrowRight className="h-4 w-4" />
              </CustomLink>
            </Button>
            <Button variant="outline" size="lg">
              Notify me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
