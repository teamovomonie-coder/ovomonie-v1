
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Wallet, Monitor, BarChart, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { href: '/agent-life', label: 'Dashboard', icon: LayoutGrid },
    { href: '/agent-life/wallet', label: 'Wallet', icon: Wallet },
    { href: '/agent-life/terminals', label: 'POS', icon: Monitor },
    { href: '/agent-life/reports', label: 'Reports', icon: BarChart },
    { href: '/agent-life/more', label: 'More', icon: MoreHorizontal },
];

const BottomNavItem = ({ href, label, icon: Icon }: NavItem) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors",
            isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary'
        )}>
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </Link>
    );
};


export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 pb-20">
            {children}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
            <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
                {navItems.map(item => <BottomNavItem key={item.href} {...item} />)}
            </div>
        </footer>
    </div>
  )
}
