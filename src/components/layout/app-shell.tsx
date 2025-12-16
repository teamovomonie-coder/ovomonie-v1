"use client";

import React, { useEffect, useState, useCallback } from 'react';
import CustomLink from '@/components/layout/custom-link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, Home, Briefcase, User, Bell, ArrowLeft, Package, CreditCard, MessageCircle, Mic, LogOut, Settings, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedNavIcon } from '@/components/layout/animated-nav-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { getPersonalizedRecommendation } from '@/ai/flows/personalized-recommendations-flow';
import { ProactiveAssistantDialog } from '../ai-assistant/proactive-assistant-dialog';
import { useToast } from '@/hooks/use-toast';
import { LogoutDialog } from '../auth/logout-dialog';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    aliases?: string[];
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/custom-card", label: "Card", icon: CreditCard },
    { href: "/agent-life", label: "Agent", icon: Briefcase },
    { href: "/profile", label: "Me", icon: User },
];

const BottomNavItem = ({ href, label, icon: Icon, aliases = [] }: NavItem) => {
    const pathname = usePathname();
    let isActive = false;
    
    if (href === '/dashboard') {
        isActive = pathname === '/dashboard';
    } else {
        isActive = pathname.startsWith(href);
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <CustomLink href={href} className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors",
                        isActive ? 'text-white font-semibold' : 'text-slate-200/80 hover:text-white'
                    )}>
                        <AnimatedNavIcon icon={Icon} label={label} isActive={isActive} />
                        <span>{label}</span>
                    </CustomLink>
                </TooltipTrigger>
                 <TooltipContent className="md:hidden">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [isProactiveAssistantOpen, setIsProactiveAssistantOpen] = useState(false);
    const [proactiveRecommendation, setProactiveRecommendation] = useState('');
    const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);

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
    
    const showHeader = pathname === '/dashboard';
    
    const firstName = user?.fullName.split(' ')[0] || '';
    const lastName = user?.fullName.split(' ').slice(-1)[0] || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    
    const handleProactiveAssistantClick = async () => {
        if (!user || !user.userId) return;
        setIsGeneratingRecommendation(true);
        try {
            const result = await getPersonalizedRecommendation({ userName: user.fullName, userId: user.userId });
            setProactiveRecommendation(result.recommendation);
            setIsProactiveAssistantOpen(true);
        } catch (error) {
            console.error("Failed to get recommendation:", error);
            toast({
                variant: 'destructive',
                title: 'AI Assistant Error',
                description: 'Could not generate a recommendation at this time.',
            });
        } finally {
            setIsGeneratingRecommendation(false);
        }
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {showHeader && (
                <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0b1b3a] via-[#0f2552] to-[#0b1b3a] text-white flex items-center justify-between px-4 z-50 border-b border-[#13284d] shadow-[0_4px_12px_rgba(0,0,0,0.25)] backdrop-blur">
                     <div className="flex items-center gap-3">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button aria-label="User menu">
                                    <Avatar className="h-9 w-9 border-2 border-gray-400">
                                        <AvatarImage src={user?.photoUrl || user?.avatarUrl} alt="User" data-ai-hint="person avatar" />
                                        <AvatarFallback className="bg-gradient-to-r from-[#0b1b3a] via-[#0f2552] to-[#0b1b3a] text-white font-semibold">{initials || "U"}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>{user?.fullName}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild><CustomLink href="/profile" className="w-full justify-start"><User className="mr-2"/>Profile</CustomLink></DropdownMenuItem>
                                <DropdownMenuItem asChild><CustomLink href="/security" className="w-full justify-start"><Shield className="mr-2"/>Settings</CustomLink></DropdownMenuItem>
                                <DropdownMenuItem asChild><CustomLink href="/notifications" className="w-full justify-start"><Bell className="mr-2"/>Notifications</CustomLink></DropdownMenuItem>
                                <DropdownMenuItem asChild><CustomLink href="/support" className="w-full justify-start"><MessageCircle className="mr-2"/>Support</CustomLink></DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <LogoutDialog>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}><LogOut className="mr-2"/>Logout</DropdownMenuItem>
                                </LogoutDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="font-semibold text-base">Hi, {firstName}</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button variant="ghost" size="icon" onClick={handleProactiveAssistantClick} disabled={isGeneratingRecommendation}>
                            {isGeneratingRecommendation ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />}
                        </Button>
                        <CustomLink href="/support" className="relative">
                            <MessageCircle className="h-6 w-6" />
                        </CustomLink>
                        <CustomLink href="/notifications" className="relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </CustomLink>
                    </div>
                </header>
            )}

            <main className={cn("flex-1 pb-20", showHeader ? "pt-16" : "pt-4")}>
                {children}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#0b1b3a] via-[#0f2552] to-[#0b1b3a] text-white z-50 border-t border-[#13284d] shadow-[0_-6px_18px_rgba(0,0,0,0.25)] backdrop-blur">
                <nav className="flex items-center h-16 max-w-2xl mx-auto">
                    {navItems.map(item => <BottomNavItem key={item.href} {...item} />)}
                </nav>
            </footer>
            
             <ProactiveAssistantDialog
                open={isProactiveAssistantOpen}
                onOpenChange={setIsProactiveAssistantOpen}
                recommendation={proactiveRecommendation}
                onAction={() => {
                    setIsProactiveAssistantOpen(false);
                    router.push('/ai-assistant');
                }}
            />
        </div>
    );
}
