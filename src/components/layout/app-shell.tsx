
"use client";
import React, { useEffect } from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  MessageCircle,
  Send,
  Receipt,
  ArrowDownUp,
  Wallet,
  Smartphone,
  Target,
  PiggyBank,
  BadgeDollarSign,
  Gift,
  LayoutGrid,
  PlusCircle,
  Award,
  FileText,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutDialog } from "@/components/auth/logout-dialog";
import { useAuth } from "@/context/auth-context";
import { OvoLogo } from "./logo";
import { Loader2 } from "lucide-react";


export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (isAuthenticated === false) {
          router.push(`/login?callbackUrl=${pathname}`);
        }
    }, [isAuthenticated, router, pathname]);

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/ai-assistant", label: "AI Assistant", icon: MessageCircle },
        { href: "/memo-transfer", label: "Send Money", icon: Send },
        { href: "/add-money", label: "Add Money", icon: PlusCircle },
        { href: "/withdraw", label: "Withdraw", icon: ArrowDownUp },
        { href: "/statements", label: "Statements", icon: FileText },
        { href: "/airtime", label: "Airtime/Data", icon: Smartphone },
        { href: "/bill-payment", label: "Bill Payments", icon: Receipt },
        { href: "/betting", label: "Betting", icon: Target },
        { href: "/ovo-wealth", label: "Ovo-Wealth", icon: PiggyBank },
        { href: "/loan", label: "Loans", icon: BadgeDollarSign },
        { href: "/rewards", label: "Rewards", icon: Award },
        { href: "/invitation", label: "Invitation", icon: Gift },
        { href: "/more", label: "More", icon: LayoutGrid },
    ];
    
    if (isAuthenticated === null || isAuthenticated === false) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <OvoLogo className="h-10 w-10" />
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
              <LogoutDialog>
                <SidebarMenuButton tooltip="Logout">
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </LogoutDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-4">
            <div className="p-2 flex items-center gap-2 rounded-lg bg-card-foreground/5">
                <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@user" data-ai-hint="person avatar" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                    <span className="font-semibold">User</span>
                    <span className="text-muted-foreground">user@email.com</span>
                </div>
            </div>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:hidden">
            <OvoLogo className="h-10 w-10" />
            <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
