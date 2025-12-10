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
            <div className="relative flex h-full flex-col items-center justify-between text-center">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="relative rounded-lg sm:rounded-2xl bg-white/80 p-2 sm:p-3 shadow-inner">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-80" />
                  <feature.icon className="relative h-5 w-5 sm:h-7 sm:w-7 text-[#050a1a]" />
                </div>
                <p className="text-[12px] sm:text-base font-black text-[#050a1a] leading-tight tracking-tight">
                  {feature.label}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="absolute top-[3px] right-[3px] text-[7px] sm:text-[9px] font-black uppercase tracking-[0.22em] bg-[#0b1a3a] text-white px-1.5 py-[3px] rounded-full shadow-md shadow-blue-900/40 border border-white/30"
              >
                FAST
              </Badge>
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
            <div className="flex h-full flex-col items-center gap-2 text-center">
              <div className="rounded-lg bg-slate-100 p-1.5 shadow-inner">
                <feature.icon className="h-5 w-5 text-[#050a1a]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[12px] sm:text-[15px] font-black text-[#050a1a] leading-tight tracking-tight">{feature.label}</p>
              </div>
            </div>
          </CustomLink>
        ))}
      </div>
    </div>
  );
}
