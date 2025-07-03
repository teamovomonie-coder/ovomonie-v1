
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import {
    Monitor, Award, Percent, Siren,
    Wallet, Briefcase, Link as LinkIcon, CreditCard, Users,
    Download, RefreshCw, BarChart3, TrendingUp, ArrowRightLeft,
    User, Shield, MessageCircle, FileText, Settings, KeyRound
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';

interface ServiceItem {
  title: string;
  href: string;
  icon: LucideIcon;
  isWIP?: boolean;
}

interface ServiceCategory {
  title: string;
  description: string;
  items: ServiceItem[];
}

const serviceCategories: ServiceCategory[] = [
    {
        title: "Agent & POS Management",
        description: "Manage your POS agents, terminals, and commissions.",
        items: [
            { title: "POS Terminals", href: "/agent-life/terminals", icon: Monitor },
            { title: "AgentLife Hub", href: "/agent-life/hub", icon: Award },
            { title: "Commissions", href: "#", icon: Percent, isWIP: true },
            { title: "Report an Issue", href: "#", icon: Siren, isWIP: true },
        ]
    },
    {
        title: "Business Wallet & Banking",
        description: "Access all wallet-related operations and financial controls.",
        items: [
            { title: "Business Wallet", href: "/agent-life/wallet", icon: Wallet },
            { title: "Payroll", href: "/payroll", icon: Users },
            { title: "Virtual Cards", href: "#", icon: CreditCard, isWIP: true },
            { title: "Link Accounts", href: "#", icon: LinkIcon, isWIP: true },
        ]
    },
    {
        title: "Payments & Settlements",
        description: "Monitor your inflow/outflow and settle instantly.",
        items: [
            { title: "Daily Settlements", href: "#", icon: Download, isWIP: true },
            { title: "Payout History", href: "#", icon: RefreshCw, isWIP: true },
            { title: "Reconciliation", href: "#", icon: BarChart3, isWIP: true },
            { title: "Transfers", href: "#", icon: ArrowRightLeft, isWIP: true },
        ]
    },
    {
        title: "Analytics & Reports",
        description: "Visual business intelligence for agents and businesses.",
        items: [
            { title: "View Reports", href: "/agent-life/reports", icon: TrendingUp },
        ]
    },
     {
        title: "Settings & Support",
        description: "Manage your account and get help when you need it.",
        items: [
            { title: "Merchant Profile", href: "#", icon: User, isWIP: true },
            { title: "KYC Upgrade", href: "#", icon: Shield, isWIP: true },
            { title: "Live Support", href: "#", icon: MessageCircle, isWIP: true },
            { title: "Settings", href: "#", icon: Settings, isWIP: true },
        ]
    }
];

const ServiceTile = ({ item }: { item: ServiceItem }) => {
    const { toast } = useToast();
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (item.isWIP) {
            e.preventDefault();
            toast({
                title: "Coming Soon!",
                description: `The "${item.title}" feature is under development.`,
            });
        }
    };
    return (
        <Link href={item.href} onClick={handleClick} className="bg-card p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:bg-muted transition-colors h-28">
            <div className="bg-primary-light-bg text-primary p-3 rounded-full mb-2">
                <item.icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-foreground">{item.title}</span>
        </Link>
    );
};

export function MerchantServicesDashboard() {
  return (
    <div className="flex-1 space-y-6 bg-background p-4">
      <header className="bg-primary text-primary-foreground -mx-4 -mt-4 p-4 py-6 rounded-b-2xl shadow-lg">
        <h2 className="text-2xl font-bold tracking-tight">Merchant Services</h2>
        <p className="text-primary-foreground/80 text-sm">Powering your Business, Agents & POS Network</p>
      </header>

      <div className="space-y-8">
        {serviceCategories.map((category) => (
          <section key={category.title}>
            <h3 className="text-lg font-bold mb-1 text-gray-800">{category.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {category.items.map((item) => (
                <ServiceTile key={item.title} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
