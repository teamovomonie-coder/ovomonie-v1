
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { AppShell } from "@/components/layout/app-shell";
import { MerchantServicesDashboard } from "@/components/merchant/merchant-services-dashboard";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

// Schema for the form
const registrationSchema = z.object({
  businessName: z.string().min(3, 'Business name is required.'),
  businessAddress: z.string().min(10, 'Full business address is required.'),
  posSerialNumber: z.string().min(5, 'A valid POS serial number is required.'),
});

// The registration form component, defined locally for this page
function MerchantRegistration({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { businessName: '', businessAddress: '', posSerialNumber: '' },
  });

  const onSubmit = async (data: z.infer<typeof registrationSchema>) => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error("Authentication failed. Please log in again.");

        const response = await fetch('/api/agent/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Registration failed.');
        }

        toast({
            title: "Registration Successful!",
            description: "Welcome to AgentLife. You can now access merchant services.",
        });
        onRegisterSuccess();
        
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Registration Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred."
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0b1a3a] via-[#0f2f63] to-[#0a56ff] text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0,rgba(255,255,255,0.16)_35%,transparent_35%,transparent_65%)] bg-[length:220px_220px]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-8 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-16 -bottom-10 h-40 w-40 rounded-full bg-[#0018ff]/30 blur-3xl" />
        </div>
        <CardHeader className="relative space-y-1 pb-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
            AgentLife
          </div>
          <CardTitle className="text-2xl font-bold">Become an Ovomonie Agent</CardTitle>
          <CardDescription className="text-white/80">
            Onboard fast, unlock merchant tools, financing, and settlement perks.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white/85">
            <div className="flex items-center gap-2 font-semibold text-white">
              Live agent APIs humming
            </div>
            <p className="text-white/80 mt-1">Payouts, commissions, and device pings streaming in real time.</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-white/80">
              {["Payouts", "Commissions", "Device"].map((label, idx) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-end gap-1 h-6">
                    <span className="w-1.5 rounded-full bg-white/70 animate-pulse" style={{ height: '14px', animationDelay: `${idx * 0.15}s` }} />
                    <span className="w-1.5 rounded-full bg-white/70 animate-pulse" style={{ height: '20px', animationDelay: `${0.1 + idx * 0.15}s` }} />
                    <span className="w-1.5 rounded-full bg-white/70 animate-pulse" style={{ height: '12px', animationDelay: `${0.2 + idx * 0.15}s` }} />
                    <span className="w-1.5 rounded-full bg-white/70 animate-pulse" style={{ height: '18px', animationDelay: `${0.3 + idx * 0.15}s` }} />
                    <span className="w-1.5 rounded-full bg-white/70 animate-pulse" style={{ height: '10px', animationDelay: `${0.4 + idx * 0.15}s` }} />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/85">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Loader2 className="h-4 w-4 animate-spin-slow text-amber-200" /> Stripe-inspired flow, Naija-ready
            </div>
            <p className="text-white/80 mt-1">PCI-safe capture, device checks, and instant confirmations.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/90">Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Registered Business Name" {...field} className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-white/60 focus-visible:ring-white/60" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/90">Business Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Full Business Address" {...field} className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-white/60 focus-visible:ring-white/60" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="posSerialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/90">POS Device Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SN-A987B1" {...field} className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-white/60 focus-visible:ring-white/60" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-white text-[#0b1a3a] hover:bg-white/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Now
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// The main page component that handles the view logic
export default function AgentLifePage() {
  const { user, fetchUserData } = useAuth();

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {user?.isAgent ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MerchantServicesDashboard />
          </motion.div>
        ) : (
          <motion.div
            key="registration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MerchantRegistration onRegisterSuccess={fetchUserData} />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
