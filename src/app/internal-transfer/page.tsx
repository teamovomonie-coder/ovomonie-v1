import { AppShell } from "@/components/layout/app-shell";
import { InternalTransferForm } from "@/components/internal-transfer/internal-transfer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function InternalTransferPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,150,255,0.12),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(11,27,58,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(0,24,255,0.08),transparent_35%)]" />
        <div className="absolute inset-0 opacity-50 blur-3xl bg-gradient-to-br from-[#0a56ff]/18 via-transparent to-[#0b1b3a]/22 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%27120%27 height=%27120%27 viewBox=%270 0 120 120%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 stroke=%27rgba(255,255,255,0.08)%27 stroke-width=%271%27%3E%3Ccircle cx=%2760%27 cy=%2760%27 r=%2720%27/%3E%3Ccircle cx=%2760%27 cy=%2760%27 r=%2740%27/%3E%3Ccircle cx=%2760%27 cy=%2760%27 r=%2760%27/%3E%3C/g%3E%3C/svg%3E')] opacity-60 pointer-events-none mix-blend-overlay" />

        <div className="relative max-w-5xl mx-auto space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-lg shadow-blue-100/40">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,24,255,0.07),rgba(11,26,58,0.05),transparent)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Internal Transfer
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Send to any Ovomonie account instantly.</h1>
                <p className="text-slate-600 text-sm">
                  Verify recipient, add your note, and we’ll handle the rails with fintech-grade reliability.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-inner">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secure & instant
              </div>
            </div>
          </div>

          <Card className="max-w-5xl mx-auto rounded-2xl shadow-xl border border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">Send to Ovomonie User</CardTitle>
              <CardDescription className="text-slate-600">
                Transfer funds instantly to any Ovomonie account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <InternalTransferForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
