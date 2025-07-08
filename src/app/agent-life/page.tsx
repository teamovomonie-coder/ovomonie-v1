
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Become an Ovomonie Agent</CardTitle>
          <CardDescription>Fill in your details to get started with our merchant services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input placeholder="Your Registered Business Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl><Input placeholder="Your Full Business Address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="posSerialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>POS Device Serial Number</FormLabel>
                    <FormControl><Input placeholder="e.g., SN-A987B1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
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
