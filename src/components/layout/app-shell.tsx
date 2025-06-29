"use client";
import React from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Nfc,
  PiggyBank,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SheetTitle } from "../ui/sheet";

const OvoLogo = () => (
  <div className="flex items-center gap-2">
    <Wallet className="w-8 h-8 text-primary" />
    <h1 className="text-2xl font-bold text-primary">OVO Thrive</h1>
  </div>
);

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const navItems = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/ai-assistant", label: "AI Assistant", icon: MessageCircle },
        { href: "/memo-transfer", label: "Send Money", icon: Send },
        { href: "/withdraw", label: "Withdraw", icon: ArrowDownUp },
        { href: "/airtime", label: "Airtime/Data", icon: Smartphone },
        { href: "/bill-payment", label: "Bill Payments", icon: Receipt },
        { href: "/betting", label: "Betting", icon: Target },
        { href: "/ovo-wealth", label: "Ovo-Wealth", icon: PiggyBank },
        { href: "/loan", label: "Loans", icon: BadgeDollarSign },
        { href: "/contactless-banking", label: "Contactless", icon: Nfc },
    ];
    
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <OvoLogo />
            <SidebarTrigger />
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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
            <OvoLogo />
            <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
