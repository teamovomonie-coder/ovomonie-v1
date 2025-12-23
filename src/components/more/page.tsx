
"use client";

import React, { useState, useMemo } from 'react';
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Search, Send, Landmark, Sparkles, Plus, ArrowDownUp, Mic, Nfc, QrCode, Smartphone, Tv, Zap, FileText, Target, Receipt, Briefcase, UserCheck, Store, Package, Monitor, CreditCard, Users, BadgeDollarSign, PiggyBank, CandlestickChart, Gauge, Plane, Hotel, Car, Ticket, ShoppingCart, ShoppingBag, Building2, Vote, Book, Gift, Trophy, Percent, Medal, User, Shield, Settings, MessageCircle, LogOut, Utensils, Fingerprint, Hash, TrendingUp, DollarSign, Bitcoin, ShieldCheck, UserPlus, Star, Exchange } from "lucide-react";
import CustomLink from "@/components/layout/custom-link";
import type { LucideIcon } from 'lucide-react';
import { LogoutDialog } from "@/components/auth/logout-dialog";
import { useToast } from '@/hooks/use-toast';

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
      { label: "Currency Exchange", icon: Exchange, href: "/currency-exchange" },
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
      { label: "Savings Goals", icon: Target, href: "/savings-goals" },
      { label: "Budgeting Tools", icon: TrendingUp, href: "/budgeting" },
      { label: "Crypto Trading", icon: Bitcoin, href: "/crypto-trading" },
      { label: "Insurance", icon: ShieldCheck, href: "/insurance" },
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
      { label: "Tax & Remittance", icon: Landmark, href: "/tax-remittance" },
      { label: "WAEC/NECO PINs", icon: Book, href: "/waec-neco" },
    ],
  },
  {
    title: "Engagement & Rewards",
    services: [
      { label: "Invite & Earn", icon: Gift, href: "/referrals" },
      { label: "Referral Program", icon: UserPlus, href: "/referrals" },
      { label: "Loyalty Points", icon: Star, href: "/loyalty" },
      { label: "Rewards Hub", icon: Trophy, href: "/rewards" },
    ],
  },
  {
    title: "Account & App Settings",
    services: [
      { label: "Profile / KYC", icon: User, href: "/profile" },
      { label: "Security", icon: Shield, href: "/security" },
      { label: "Statements", icon: FileText, href: "/statements" },
      { label: "Custom Account No.", icon: Hash, href: "/custom-account-number" },
      { label: "Settings", icon: Settings, href: "/security" },
      { label: "Support", icon: MessageCircle, href: "/support" },
      { label: "Logout", icon: LogOut, href: "#" },
    ],
  },
];


const getLabelText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getLabelText).join(' ');

  if (React.isValidElement(node) && node.props.children) {
    return React.Children.toArray(node.props.children).map(getLabelText).join(' ');
  }
  return '';
};

const ServiceTile = ({ service }: { service: Service }) => {
  const { toast } = useToast();
  const tileClassName = "bg-card p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:bg-muted transition-colors h-full";
  
  const tileContent = (
    <>
      <div className="bg-primary-light-bg text-primary p-3 rounded-full mb-2">
        <service.icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold text-foreground leading-tight">{service.label}</span>
    </>
  );
  
  if (service.href === "#") {
    if (getLabelText(service.label) === "Logout") {
      return (
        <LogoutDialog>
          <button type="button" className={tileClassName}>
            {tileContent}
          </button>
        </LogoutDialog>
      );
    }
    // Handle other WIP links
    return (
      <button 
        type="button" 
        className={tileClassName} 
        onClick={() => toast({
          title: "Coming Soon!",
          description: `The "${getLabelText(service.label)}" feature is under development.`
        })}
      >
        {tileContent}
      </button>
    );
  }

  return (
    <CustomLink href={service.href} className={tileClassName}>
      {tileContent}
    </CustomLink>
  );
};


export default function MorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServiceData = useMemo(() => {
    if (!searchQuery) {
        return serviceData;
    }
    const lowercasedQuery = searchQuery.toLowerCase();

    return serviceData.map(category => {
        const filteredServices = category.services.filter(service => 
            getLabelText(service.label).toLowerCase().includes(lowercasedQuery)
        );

        if (category.title.toLowerCase().includes(lowercasedQuery) || filteredServices.length > 0) {
            return {
                ...category,
                services: category.title.toLowerCase().includes(lowercasedQuery) ? category.services : filteredServices
            };
        }
        return null;
    }).filter(Boolean) as ServiceCategory[];
  }, [searchQuery]);

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 bg-background">
        <h2 className="text-3xl font-bold tracking-tight text-primary">All Services</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search services..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredServiceData.length > 0 ? (
            <div className="space-y-8">
            {filteredServiceData.map((category) => (
                <section key={category.title}>
                <h3 className="text-xl font-semibold mb-4 text-primary">{category.title}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {category.services.map((service, index) => (
                    <ServiceTile key={`${getLabelText(service.label)}-${index}`} service={service} />
                    ))}
                </div>
                </section>
            ))}
            </div>
        ) : (
            <div className="text-center py-16 text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-4" />
                <p className="font-semibold">No services found</p>
                <p className="text-sm">Your search for "{searchQuery}" did not match any services.</p>
            </div>
        )}
      </div>
    </AppShell>
  );
}
