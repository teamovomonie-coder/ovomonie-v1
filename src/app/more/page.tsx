import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Search, Send, Landmark, Sparkles, Plus, ArrowDownUp, Mic, Nfc, QrCode, Smartphone, Tv, Zap, FileText, Target, Receipt, Briefcase, UserCheck, Store, Package, Monitor, CreditCard, Users, BadgeDollarSign, PiggyBank, CandlestickChart, Gauge, Plane, Hotel, Car, Ticket, ShoppingCart, ShoppingBag, Fingerprint, Vote, Book, Gift, Trophy, Percent, Medal, User, Shield, Settings, MessageCircle, LogOut } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';

interface Service {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface ServiceCategory {
  title: string;
  services: Service[];
}

const serviceData: ServiceCategory[] = [
  {
    title: "Core Banking",
    services: [
      { label: "To Ovomonie", icon: Send, href: "/memo-transfer" },
      { label: "To Bank", icon: Landmark, href: "/external-transfer" },
      { label: "MemoTransfer", icon: Sparkles, href: "/memo-transfer" },
      { label: "Add Money", icon: Plus, href: "/add-money" },
      { label: "Withdraw", icon: ArrowDownUp, href: "/withdraw" },
      { label: "Voice Banking", icon: Mic, href: "/ai-assistant" },
      { label: "Contactless", icon: Nfc, href: "/contactless-banking" },
      { label: "Scan to Pay", icon: QrCode, href: "/scan-to-pay" },
    ],
  },
  {
    title: "Essential Services",
    services: [
      { label: "Airtime & Data", icon: Smartphone, href: "/airtime" },
      { label: "Cable TV", icon: Tv, href: "/bill-payment" },
      { label: "Utility Payments", icon: Zap, href: "/bill-payment" },
      { label: "Bill Payments", icon: FileText, href: "/bill-payment" },
      { label: "Betting Payments", icon: Target, href: "/betting" },
    ],
  },
  {
    title: "Business & Work Tools",
    services: [
      { label: "Invoicing", icon: Receipt, href: "#" },
      { label: "Payroll", icon: Briefcase, href: "#" },
      { label: "AgentLife", icon: UserCheck, href: "#" },
      { label: "Merchant Services", icon: Store, href: "#" },
      { label: "Inventory", icon: Package, href: "#" },
      { label: "POS Terminal", icon: Monitor, href: "#" },
      { label: "Bulk Payments", icon: Users, href: "#" },
      { label: "Custom ATM Card", icon: CreditCard, href: "/custom-card" },
    ],
  },
  {
    title: "Financial Services",
    services: [
      { label: "Loans", icon: BadgeDollarSign, href: "/loan" },
      { label: "Ovo-Wealth", icon: PiggyBank, href: "/ovo-wealth" },
      { label: "Savings Goals", icon: Target, href: "/ovo-wealth" },
      { label: "Stock Trading", icon: CandlestickChart, href: "#" },
      { label: "Credit Score", icon: Gauge, href: "#" },
    ],
  },
  {
    title: "Travel & Lifestyle",
    services: [
      { label: "Flight Tickets", icon: Plane, href: "#" },
      { label: "Hotel Bookings", icon: Hotel, href: "#" },
      { label: "Ride Booking", icon: Car, href: "#" },
      { label: "Event Tickets", icon: Ticket, href: "#" },
      { label: "Online Shopping", icon: ShoppingCart, href: "#" },
      { label: "Fashion Deals", icon: ShoppingBag, href: "#" },
    ],
  },
  {
    title: "Government Services",
    services: [
      { label: "NIN Linking", icon: Fingerprint, href: "#" },
      { label: "Voter Card", icon: Vote, href: "#" },
      { label: "Passport Fees", icon: FileText, href: "#" },
      { label: "FRSC License", icon: Car, href: "#" },
      { label: "Tax & Remittance", icon: Landmark, href: "#" },
      { label: "WAEC/NECO PINs", icon: Book, href: "#" },
    ],
  },
  {
    title: "Engagement & Rewards",
    services: [
      { label: "Invite & Earn", icon: Gift, href: "/invitation" },
      { label: "Referral Program", icon: Users, href: "/invitation" },
      { label: "Rewards Wallet", icon: Trophy, href: "#" },
      { label: "Daily Offers", icon: Percent, href: "#" },
      { label: "Loyalty Points", icon: Medal, href: "#" },
    ],
  },
  {
    title: "Account & App Settings",
    services: [
      { label: "Profile / KYC", icon: User, href: "#" },
      { label: "Security", icon: Shield, href: "#" },
      { label: "Statements", icon: FileText, href: "#" },
      { label: "Settings", icon: Settings, href: "#" },
      { label: "Support", icon: MessageCircle, href: "#" },
      { label: "Logout", icon: LogOut, href: "#" },
    ],
  },
];

const ServiceTile = ({ service }: { service: Service }) => (
  <Link href={service.href} className="flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl bg-card hover:bg-accent/10 transition-colors shadow-sm">
    <div className="bg-primary/10 text-primary p-3 rounded-full">
      <service.icon className="h-6 w-6" />
    </div>
    <span className="text-sm font-semibold text-foreground">{service.label}</span>
  </Link>
);


export default function MorePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight text-primary">All Services</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search services..." className="pl-10" />
        </div>

        <div className="space-y-8">
          {serviceData.map((category) => (
            <section key={category.title}>
              <h3 className="text-xl font-semibold mb-4 text-primary">{category.title}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {category.services.map((service) => (
                  <ServiceTile key={service.label} service={service} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
