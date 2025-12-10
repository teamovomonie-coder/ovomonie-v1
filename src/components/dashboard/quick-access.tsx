import CustomLink from "@/components/layout/custom-link";
import { Landmark, Smartphone, ArrowDownUp, Zap, Target, Nfc, PiggyBank, BadgeDollarSign, Gift, LayoutGrid, Send, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  { href: "/internal-transfer", label: "To Ovomonie", icon: Send, tone: "from-emerald-100 to-white" },
  { href: "/external-transfer", label: "To Bank", icon: Landmark, tone: "from-blue-100 to-white" },
  { href: "/withdraw", label: "Withdraw", icon: ArrowDownUp, tone: "from-amber-100 to-white" },
  { href: "/airtime", label: "Airtime/Data", icon: Smartphone, tone: "from-sky-100 to-white" },
  { href: "/bill-payment", label: "Utility", icon: Zap, tone: "from-indigo-100 to-white" },
  { href: "/betting", label: "Betting", icon: Target, tone: "from-rose-100 to-white" },
  { href: "/contactless-banking", label: "Contactless", icon: Nfc, tone: "from-fuchsia-100 to-white" },
  { href: "/ovo-wealth", label: "Ovo-wealth", icon: PiggyBank, tone: "from-teal-100 to-white" },
  { href: "/loan", label: "Loan", icon: BadgeDollarSign, tone: "from-lime-100 to-white" },
  { href: "/invitation", label: "Invitation", icon: Gift, tone: "from-purple-100 to-white" },
  { href: "/more", label: "More", icon: LayoutGrid, tone: "from-slate-100 to-white" },
];

export function QuickAccess() {
  const primaryRow = features.slice(0, 3);
  const gridRow = features.slice(3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Quick access</p>
          <p className="text-lg font-semibold text-foreground">Move money, pay bills, stay fast.</p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">Live</Badge>
      </div>

      <div className="grid grid-cols-3 gap-1 sm:gap-3">
        {primaryRow.map((feature) => (
          <CustomLink
            href={feature.href}
            key={feature.label}
            className="group relative h-full overflow-hidden rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-5 shadow-sm sm:shadow-md transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start gap-2 sm:gap-3 h-full">
              <div className="relative rounded-lg sm:rounded-2xl bg-white/80 p-2 sm:p-3.5 shadow-inner">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-80" />
                <feature.icon className="relative h-5.5 w-5.5 sm:h-8 sm:w-8 text-[#050a1a]" />
              </div>
              <div className="flex-1 flex flex-col justify-between items-start min-h-[84px] sm:min-h-[90px]">
                <div className="space-y-1">
                  <p className="text-[11.5px] sm:text-[17px] font-black text-[#050a1a] leading-tight tracking-tight">{feature.label}</p>
                  <p className="text-[9px] sm:text-xs text-[#050a1a]/85 flex items-center gap-1 leading-tight font-semibold">
                    Instant, secure, PIN-first <ArrowUpRight className="h-3.5 w-3.5 text-[#050a1a]" />
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="self-end text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#0ea5e9] via-[#6366f1] to-[#a855f7] text-white px-2 py-1 rounded-full shadow-lg shadow-indigo-500/30 border border-white/30"
                >
                  FAST
                </Badge>
              </div>
            </div>
          </CustomLink>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-3">
        {gridRow.map((feature) => (
          <CustomLink
            href={feature.href}
            key={feature.label}
            className="group relative rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-full flex-col items-start gap-2">
              <div className="rounded-lg bg-slate-100 p-1.5 shadow-inner">
                <feature.icon className="h-5 w-5 text-[#050a1a]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-sm font-black text-[#050a1a] leading-tight tracking-tight">{feature.label}</p>
                <p className="text-[9px] sm:text-[11px] text-[#050a1a]/85 font-semibold">Ready 24/7</p>
              </div>
            </div>
          </CustomLink>
        ))}
      </div>
    </div>
  );
}
