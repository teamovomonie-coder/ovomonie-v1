
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { OvoLogo } from './logo';
import { Loader2, LayoutDashboard, Briefcase, LayoutGrid, Bell, ArrowLeft, Package, CreditCard, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from '@/components/ui/button';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    aliases?: string[];
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/custom-card", label: "Card", icon: CreditCard },
    { href: "/agent-life", label: "Agent", icon: Briefcase },
    { href: "/more", label: "More", icon: LayoutGrid },
];

const rootPaths = navItems.map(item => item.href);

const BottomNavItem = ({ href, label, icon: Icon, aliases = [] }: NavItem) => {
    const pathname = usePathname();
    let isActive = false;
    
    const isRootTab = navItems.some(item => item.href === href);
    if (isRootTab) {
        isActive = pathname.startsWith(href);
    }
    if (href === '/dashboard') {
        isActive = pathname === '/dashboard';
    }


    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={href} className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors",
                        isActive ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
                    )}>
                        <Icon className="h-6 w-6" />
                        <span>{label}</span>
                    </Link>
                </TooltipTrigger>
                 <TooltipContent className="md:hidden">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isAuthenticated === false) {
            router.push(`/login?callbackUrl=${pathname}`);
        }
    }, [isAuthenticated, router, pathname]);

    if (isAuthenticated === null || isAuthenticated === false) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const showBackButton = !rootPaths.includes(pathname);
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground flex items-center justify-between px-4 z-50 shadow-md">
                <div className="flex items-center gap-2">
                     {showBackButton ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => router.back()}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    ) : (
                        <Link href="/dashboard">
                            <OvoLogo width={36} height={36} />
                        </Link>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/support" className="relative">
                        <MessageCircle className="h-6 w-6" />
                    </Link>
                    <Link href="/notifications" className="relative">
                        <Bell className="h-6 w-6" />
                         <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </Link>
                    <Link href="/profile">
                         <Avatar className="h-9 w-9 border-2 border-primary-foreground/50">
                            <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-16 pb-20">
                {children}
            </main>

            {/* Fixed Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground z-50 rounded-t-xl shadow-[0_-4px_8px_-2px_rgba(0,0,0,0.1)]">
                <nav className="flex items-center h-16 max-w-2xl mx-auto">
                    {navItems.map(item => <BottomNavItem key={item.href} {...item} />)}
                </nav>
            </footer>
        </div>
    );
}
