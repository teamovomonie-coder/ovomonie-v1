
"use client";

import React, { useState, useMemo } from 'react';
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Search, Send, Landmark, Sparkles, Plus, ArrowDownUp, Mic, Nfc, QrCode, Smartphone, Zap, Target, Receipt, Briefcase, Store, Package, CreditCard, Users, BadgeDollarSign, PiggyBank, CandlestickChart, Plane, Hotel, Car, Ticket, ShoppingCart, Building2, Book, Gift, Medal, User, Shield, Settings, MessageCircle, LogOut, Utensils, Gamepad2, LayoutList } from "lucide-react";
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
    ],
  },
  {
    title: "Essential Services",
    services: [
      { label: "Airtime & Data", icon: Smartphone, href: "/airtime" },
      { label: "Utility Payments", icon: Zap, href: "/bill-payment" },
      { label: "Betting Payments", icon: Target, href: "/betting" },
      { label: "Gaming", icon: Gamepad2, href: "/gaming" },
    ],
  },
  {
    title: "Business & Work Tools",
    services: [
      { label: "Invoicing", icon: Receipt, href: "/invoicing" },
      { label: "Payroll", icon: Briefcase, href: "/payroll" },
      { label: "Merchant Services", icon: Store, href: "/agent-life" },
      { label: "Inventory", icon: Package, href: "/inventory" },
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
      { label: "Community", icon: Users, href: "/community" },
    ],
  },
  {
    title: "Government Services",
    services: [
      { label: <><span className="block">CAC</span><span className="text-xs font-normal text-muted-foreground">Business Registration</span></>, icon: Building2, href: "/cac-registration" },
      { label: "WAEC/NECO PINs", icon: Book, href: "/waec-neco" },
    ],
  },
  {
    title: "Engagement & Rewards",
    services: [
      { label: "Invite & Earn", icon: Gift, href: "/invitation" },
      { label: "Loyalty Points", icon: Medal, href: "/rewards" },
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
  const tileClassName = "p-3 rounded-2xl border-2 border-slate-200 bg-white text-[#0b1b3a] shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full";
  const iconColor = "#0a56ff"; // dashboard accent
  const iconBg = "bg-[#0a56ff]/10";
  
  const tileContent = (
    <>
      <div className={`${iconBg} text-white p-3 rounded-2xl mb-3 shadow-inner`}
           style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
        <service.icon className="h-6 w-6" color={iconColor} />
      </div>
      <span className="text-sm font-black text-[#000c99] leading-tight tracking-tight">{service.label}</span>
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
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 bg-white text-[#0b1b3a]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#0b1b3a]/70">Explore</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#0b1b3a]">All Services</h2>
              <p className="text-sm text-[#0b1b3a]/80">Utilities, transfers, payments, and more.</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0b1b3a]/60" />
            <Input 
              placeholder="Search services..." 
              className="pl-10 rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredServiceData.length > 0 ? (
              <div className="space-y-8">
              {filteredServiceData.map((category) => (
                <section key={category.title}>
                <h3 className="text-xl font-semibold mb-4 text-[#0b1b3a]">{category.title}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {category.services.map((service, index) => (
                  <ServiceTile key={`${getLabelText(service.label)}-${index}`} service={service} />
                  ))}
                </div>
                </section>
              ))}
              </div>
          ) : (
                <div className="text-center py-16 text-[#0b1b3a]/70">
                  <Search className="mx-auto h-12 w-12 mb-4 text-[#0b1b3a]/60" />
                  <p className="font-semibold text-[#0b1b3a]">No services found</p>
                  <p className="text-sm text-[#0b1b3a]/80">Your search for "{searchQuery}" did not match any services.</p>
              </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
