
"use client";

import React, { useEffect, useState } from 'react';
import CustomLink from '@/components/layout/custom-link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, LayoutDashboard, Briefcase, User, Bell, ArrowLeft, Package, CreditCard, MessageCircle, Mic } from 'lucide-react';
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
import { getPersonalizedRecommendation } from '@/ai/flows/personalized-recommendations-flow';
import { ProactiveAssistantDialog } from '../ai-assistant/proactive-assistant-dialog';
import { useToast } from '@/hooks/use-toast';

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
                        isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary'
                    )}>
                        <Icon className="h-6 w-6" />
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
    
    const handleProactiveAssistantClick = async () => {
        if (!user) return;
        setIsGeneratingRecommendation(true);
        try {
            const result = await getPersonalizedRecommendation({ userName: user.fullName });
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
                <header className="fixed top-0 left-0 right-0 h-16 bg-background text-foreground flex items-center justify-between px-4 z-50 border-b">
                     <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg hidden sm:inline">Hi, {firstName.toUpperCase()}</span>
                        <CustomLink href="/profile">
                            <Avatar className="h-9 w-9 border-2 border-primary/50">
                                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                                <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </CustomLink>
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

            <footer className="fixed bottom-0 left-0 right-0 bg-background z-50 border-t">
                <nav className="flex items-center h-16 max-w-2xl mx-auto">
                    {navItems.map(item => <BottomNavItem key={item.href} {...item} />)}
                </nav>
            </footer>
            
             <ProactiveAssistantDialog
                open={isProactiveAssistantOpen}
                onOpenChange={setIsProactiveAssistantOpen}
                recommendation={proactiveRecommendation}
                onAction={() => {
                    // This could navigate to the main chat or another relevant screen
                    setIsProactiveAssistantOpen(false);
                    router.push('/ai-assistant');
                }}
            />
        </div>
    );
}
