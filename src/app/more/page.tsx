
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Search, Send, Landmark, Sparkles, Plus, ArrowDownUp, Mic, Nfc, QrCode, Smartphone, Tv, Zap, FileText, Target, Receipt, Briefcase, UserCheck, Store, Package, Monitor, CreditCard, Users, BadgeDollarSign, PiggyBank, CandlestickChart, Gauge, Plane, Hotel, Car, Ticket, ShoppingCart, ShoppingBag, Building2, Vote, Book, Gift, Trophy, Percent, Medal, User, Shield, Settings, MessageCircle, LogOut, Utensils, Fingerprint } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';

interface Service {
  label: React.ReactNode;
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
      { label: "To Ovomonie", icon: Send, href: "/internal-transfer" },
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
      { label: "Invoicing", icon: Receipt, href: "/invoicing" },
      { label: "Payroll", icon: Briefcase, href: "/payroll" },
      { label: "AgentLife", icon: UserCheck, href: "/agent-life" },
      { label: "Merchant Services", icon: Store, href: "/agent-life" },
      { label: "Inventory", icon: Package, href: "/inventory" },
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
      { label: "Stock Trading", icon: CandlestickChart, href: "/stock-trading" },
      { label: "Credit Score", icon: Gauge, href: "#" },
    ],
  },
  {
    title: "Travel & Lifestyle",
    services: [
      { label: "Flight Tickets", icon: Plane, href: "/flights" },
      { label: "Hotel Bookings", icon: Hotel, href: "/hotel-booking" },
      { label: "Ride Booking", icon: Car, href: "/ride-booking" },
      { label: "Event Tickets", icon: Ticket, href: "/events" },
      { label: "Food Delivery", icon: Utensils, href: "/food-delivery" },
      { label: "Online Shopping", icon: ShoppingCart, href: "/online-shopping" },
      { label: "Fashion Deals", icon: ShoppingBag, href: "/fashion-deals" },
    ],
  },
  {
    title: "Government Services",
    services: [
      { label: <><span className="block">CAC</span><span className="text-xs font-normal text-muted-foreground">Business Registration</span></>, icon: Building2, href: "/cac-registration" },
      { label: "Voter Card", icon: Vote, href: "/voter-registration" },
      { label: <><span className="block">NIN</span><span className="text-xs font-normal text-muted-foreground">Registration</span></>, icon: Fingerprint, href: "/nin-registration" },
      { label: "FRSC License", icon: Car, href: "/frsc-license" },
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
    <Link href={service.href} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
        <div className="bg-primary/10 text-primary p-3 rounded-full mb-2">
            <service.icon className="h-6 w-6" />
        </div>
        <span className="text-sm font-semibold text-foreground leading-tight">{service.label}</span>
    </Link>
);


export default function MorePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 bg-gray-50">
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
                {category.services.map((service, index) => (
                  <ServiceTile key={`${service.href}-${index}`} service={service} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
