import { AppShell } from "@/components/layout/app-shell";
import { AddMoneyOptions } from "@/components/add-money/add-money-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap } from "lucide-react";

export default function AddMoneyPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 relative">
        <div className="relative max-w-5xl mx-auto space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,24,255,0.08),rgba(11,26,58,0.06),transparent)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Add Money
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Fund your wallet with clean rails, Naija speed.</h1>
                <p className="text-slate-600 text-sm">
                  Bank, card, USSD, QR, or agent—streamlined flows built for Nigerian rails with instant confirmations.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-inner">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secured by 3DS & device checks
              </div>
            </div>
          </div>

          <Card className="max-w-5xl mx-auto rounded-2xl shadow-md border border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Choose how you want to add money</CardTitle>
              <CardDescription className="text-slate-600">
                Switch rails seamlessly—transfer, cards, USSD, QR, or an agent handoff.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <AddMoneyOptions />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
