
"use client";

import { Suspense, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomLink from '@/components/layout/custom-link';



import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OvoLogo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { Clock3, Loader2, ShieldCheck, Smartphone, Sparkles, Eye, EyeOff, CreditCard } from 'lucide-react';

const loginSchema = z.object({
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Must be a valid 11-digit Nigerian phone number.'),
  pin: z.string().length(6, 'Your PIN must be 6 digits.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const trustSignals = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'CBN Licensed & NDIC Covered',
        description: 'Protected microfinance operations built for Nigerian customers.',
      },
      {
        icon: Smartphone,
        title: 'Device-Aware Security',
        description: 'PIN-only sign in with fraud monitoring for agents and customers.',
      },
      {
        icon: Clock3,
        title: '24/7 Availability',
        description: 'Always-on access for cash-in, savings, and transfers.',
      },
      {
        icon: Sparkles,
        title: 'Built for Nigeria',
        description: 'Local rails, agency network support, and BVN-aligned controls.',
      },
    ],
    [],
  );

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', pin: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.phone, data.pin);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      // Redirect to the originally intended page or dashboard
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
          className: "bg-[#0b1a3a] text-white border border-[#0b1a3a]",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-light-bg via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-stretch lg:px-8 xl:px-12">
        <div className="hidden w-full max-w-xl flex-col justify-between rounded-3xl bg-primary px-10 py-12 text-primary-foreground shadow-2xl shadow-primary/20 lg:flex">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <OvoLogo className="drop-shadow-lg" />
                <div>
                  <p className="text-sm text-primary-foreground/80">OVOMONIE Microfinance</p>
                  <p className="text-lg font-semibold">Digital Branch</p>
                </div>
              </div>
            <Badge className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground">CBN Licensed</Badge>
            </div>

            <div className="mt-10 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Secure Sign In</p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight">Bank securely. Grow steadily.</h1>
                <p className="mt-3 text-primary-foreground/80">
                Protected sign in for individuals, agents, and SMEs across Nigeria with NDIC-backed coverage.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {trustSignals.map((item) => (
                  <div
                  key={item.title}
                  className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 shadow-sm shadow-primary/10"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-primary-foreground" aria-hidden />
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-primary-foreground/80">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Need help logging in?</p>
                <p className="text-sm text-primary-foreground/80">Call 0700-OVO-CARE or reach out to your account officer.</p>
              </div>
              <Badge className="border-primary-foreground/30 bg-primary-foreground/20 text-[11px] text-primary-foreground" variant="secondary">
                24/7 Support
              </Badge>
            </div>
            <p className="mt-3 text-xs text-primary-foreground/80">Your deposits remain insured and device-bound.</p>
          </div>
        </div>

        <div className="flex flex-1 items-center pb-6 lg:pb-0">
          <Card className="w-full border border-slate-100/80 shadow-xl shadow-primary/5">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <OvoLogo width={36} height={36} />
                  <span>Sign in to continue</span>
                </div>
                <Badge variant="secondary" className="text-xs text-primary">Secure PIN</Badge>
              </div>
              <CardTitle className="text-3xl font-semibold">Welcome back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="phone"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0801 234 5678"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-Digit PIN</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPin ? "text" : "password"}
                              placeholder="••••••"
                              maxLength={6}
                              inputMode="numeric"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <CustomLink href="/forgot-pin" className="font-semibold text-primary">
                      Forgot PIN?
                    </CustomLink>
                    <CustomLink href="/register" className="font-semibold text-primary">
                      Open an account
                    </CustomLink>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                  </Button>
                </form>
              </Form>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-muted/30 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-semibold">Protected session</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed">
                  We verify your device, enforce PIN retry limits, and align with NDIC coverage for every customer.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
