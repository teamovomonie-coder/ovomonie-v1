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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Quick access</p>
          <p className="text-lg font-semibold text-foreground">Move money, pay bills, stay fast.</p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">Live</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {primaryRow.map((feature) => (
          <CustomLink
            href={feature.href}
            key={feature.label}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${feature.tone} p-4 shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:shadow-xl backdrop-blur`}
          >
            <div className="absolute right-3 top-3">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide bg-white/70 text-foreground">
                Fast
              </Badge>
            </div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center gap-3">
              <div className="relative rounded-2xl bg-white/80 p-3 shadow-inner">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-80" />
                <feature.icon className="relative h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{feature.label}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Instant, secure, PIN-first <ArrowUpRight className="h-3 w-3 text-primary" />
                </p>
              </div>
            </div>
          </CustomLink>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {gridRow.map((feature) => (
          <CustomLink
            href={feature.href}
            key={feature.label}
            className={`group relative rounded-2xl border border-slate-200 bg-gradient-to-br ${feature.tone} p-3 shadow-sm shadow-primary/5 transition hover:-translate-y-1 hover:shadow-md`}
          >
            <div className="absolute -left-4 -top-4 h-14 w-14 rounded-full bg-primary/5 blur-xl" />
            <div className="flex h-full flex-col items-start gap-2">
              <div className="rounded-xl bg-white/85 p-2.5 shadow-inner">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground leading-tight">{feature.label}</p>
                <p className="text-[11px] text-muted-foreground">Ready 24/7</p>
              </div>
            </div>
          </CustomLink>
        ))}
      </div>
    </div>
  );
}
