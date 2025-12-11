import { AppShell } from "@/components/layout/app-shell";
import { BillerList } from "@/components/bill-payment/biller-list";
import { ShieldCheck, Zap } from "lucide-react";

export default function BillPaymentPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,24,255,0.07),rgba(11,26,58,0.05),transparent)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                Bill Payments
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pay bills with a clean, Paystack-inspired flow.</h1>
              <p className="text-slate-600 text-sm">
                Electricity, TV, internet, water—verify, choose package, confirm. Minimal friction, instant receipts.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-inner">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Secured checkout rails
            </div>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(0,24,255,0.06),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(11,26,58,0.07),transparent_35%)]" />
          <BillerList />
        </div>
      </div>
    </AppShell>
  );
}
