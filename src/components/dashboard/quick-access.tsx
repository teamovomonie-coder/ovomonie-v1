
import Link from "next/link";
import { Landmark, Smartphone, ArrowDownUp, Zap, Target, Nfc, PiggyBank, BadgeDollarSign, Gift, MoreHorizontal, Send, LayoutGrid } from "lucide-react";

const features = [
  { href: "/internal-transfer", label: "To Ovomonie", icon: Send },
  { href: "/external-transfer", label: "To Bank", icon: Landmark },
  { href: "/withdraw", label: "Withdraw", icon: ArrowDownUp },
  { href: "/airtime", label: "Airtime/Data", icon: Smartphone },
  { href: "/bill-payment", label: "Utility", icon: Zap },
  { href: "/betting", label: "Betting", icon: Target },
  { href: "/contactless-banking", label: "Contactless", icon: Nfc },
  { href: "/ovo-wealth", label: "Ovo-wealth", icon: PiggyBank },
  { href: "/loan", label: "Loan", icon: BadgeDollarSign },
  { href: "/invitation", label: "Invitation", icon: Gift },
  { href: "/more", label: "More", icon: LayoutGrid },
];

const largeFeatures = features.slice(0, 3);
const smallFeatures = features.slice(3);

export function QuickAccess() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {largeFeatures.map((feature) => (
          <Link href={feature.href} key={feature.label} className="bg-card p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:bg-muted transition-colors">
            <div className="bg-primary-light-bg text-primary rounded-lg p-3 mb-2">
                <feature.icon className="h-8 w-8" />
            </div>
            <span className="font-semibold text-foreground text-sm">{feature.label}</span>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
         {smallFeatures.map((feature) => (
          <Link href={feature.href} key={feature.label} className="bg-card p-2 rounded-xl shadow-sm flex flex-col items-center justify-center text-center h-24 hover:bg-muted transition-colors">
            <div className="bg-primary-light-bg text-primary rounded-lg p-2.5 mb-2">
                <feature.icon className="h-6 w-6" />
            </div>
            <span className="font-medium text-foreground text-xs">{feature.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
