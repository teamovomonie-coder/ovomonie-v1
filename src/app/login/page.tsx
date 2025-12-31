
"use client";

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomLink from '@/components/layout/custom-link';
import BiometricLogin from '@/components/auth/biometric-login';
import { BiometricAuth } from '@/lib/biometric';
import { LivenessCheckModal } from '@/components/auth/liveness-check/liveness-check-modal';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OvoLogo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { Clock3, Loader2, ShieldCheck, Smartphone, Sparkles, Eye, EyeOff, Fingerprint } from 'lucide-react';

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
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lastUsedPhone, setLastUsedPhone] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  
  useEffect(() => {
    // Listen for liveness check event from auth context
    const handleLivenessCheck = (event: CustomEvent) => {
      setDeviceFingerprint(event.detail.deviceFingerprint || '');
      setShowLivenessCheck(true);
    };
    
    window.addEventListener('show-liveness-check', handleLivenessCheck as EventListener);
    
    return () => {
      window.removeEventListener('show-liveness-check', handleLivenessCheck as EventListener);
    };
  }, []);
  
  useEffect(() => {
    const initBiometric = async () => {
      const available = await BiometricAuth.isAvailable();
      setBiometricAvailable(available);
      
      // Check if user has biometric registered
      const savedPhone = localStorage.getItem('lastLoginPhone');
      if (savedPhone && BiometricAuth.hasRegistered(savedPhone)) {
        setLastUsedPhone(savedPhone);
        setShowBiometric(true);
      }
    };
    
    initBiometric();
  }, []);
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
      
      // Save phone for biometric login
      localStorage.setItem('lastLoginPhone', data.phone);
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      
      // Redirect to the originally intended page or dashboard
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a closed account error
        if (error.message.includes('Account is closed')) {
          setShowRecovery(true);
          toast({
            title: 'Account Closed',
            description: 'Your account was closed but can be recovered. Use the recovery option below.',
            className: "bg-yellow-50 text-yellow-800 border border-yellow-200",
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message,
            className: "bg-[#0b1a3a] text-white border border-[#0b1a3a]",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricSuccess = () => {
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    router.push(callbackUrl);
  };

  const handleBiometricFallback = () => {
    setShowBiometric(false);
  };

  const handleLivenessSuccess = () => {
    setShowLivenessCheck(false);
    // Continue with login flow - user is already logged in
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    router.push(callbackUrl);
  };

  const handleRecoverAccount = async () => {
    const phone = form.getValues('phone');
    const pin = form.getValues('pin');
    
    if (!phone || !pin) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your phone number and PIN to recover your account.',
      });
      return;
    }

    setIsRecovering(true);
    try {
      const response = await fetch('/api/user/recover-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: `${phone}@temp.com`,
          password: pin 
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Account Recovered!',
          description: 'Your account has been successfully reactivated.',
        });
        setShowRecovery(false);
        await onSubmit({ phone, pin });
      } else {
        toast({
          variant: 'destructive',
          title: 'Recovery Failed',
          description: result.message || 'Failed to recover account',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to recover account. Please try again.',
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Enhanced Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl animate-pulse delay-500" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-12"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-300/10 to-transparent transform -rotate-12"></div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-stretch lg:px-8 xl:px-12">
        {/* Left Panel - Enhanced */}
        <div className="hidden w-full max-w-xl flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-600/20 px-10 py-12 text-white shadow-2xl lg:flex">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <OvoLogo className="drop-shadow-2xl" />
                <div>
                  <p className="text-sm text-slate-300/80">OVOMONIE Microfinance</p>
                  <p className="text-lg font-semibold text-white">Digital Branch</p>
                </div>
              </div>
            <Badge className="border-slate-400/30 bg-slate-600/20 text-slate-200 backdrop-blur-sm">CBN Licensed</Badge>
            </div>

            <div className="mt-10 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400/70 font-medium">Secure Sign In</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Bank securely. Grow steadily.</h1>
                <p className="mt-3 text-slate-200/90 leading-relaxed">
                Protected sign in for individuals, agents, and SMEs across Nigeria with NDIC-backed coverage.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {trustSignals.map((item, index) => (
                  <div
                  key={item.title}
                  className="rounded-2xl border border-slate-600/20 bg-white/10 backdrop-blur-sm p-4 shadow-lg hover:bg-white/15 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-600/20 flex items-center justify-center group-hover:bg-slate-600/30 transition-colors">
                      <item.icon className="h-4 w-4 text-slate-300" aria-hidden />
                    </div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-200/80 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Support Section */}
          <div className="mt-10 rounded-2xl border border-slate-600/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Need help logging in?
                </div>
                <p className="text-sm text-slate-200/80 mt-1">Call 0700-OVO-CARE or reach out to your account officer.</p>
              </div>
              <Badge className="border-green-400/30 bg-green-500/20 text-green-100 text-[11px] backdrop-blur-sm" variant="secondary">
                24/7 Support
              </Badge>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-600/20">
              <p className="text-xs text-slate-300/70 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Your deposits remain insured and device-bound.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Enhanced */}
        <div className="flex flex-1 items-center pb-6 lg:pb-0">
          {showBiometric ? (
            <div className="w-full">
              <BiometricLogin 
                userId={lastUsedPhone}
                onSuccess={handleBiometricSuccess}
                onFallback={handleBiometricFallback}
              />
            </div>
          ) : (
            <Card className="w-full border border-slate-300/20 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 rounded-3xl">
              <CardHeader className="space-y-4 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <OvoLogo width={40} height={40} />
                    <span className="font-medium">Sign in to continue</span>
                  </div>
                  <Badge variant="secondary" className="text-xs text-slate-700 bg-slate-100 border-slate-300">Secure PIN</Badge>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 mb-2">Welcome back</CardTitle>
                  <p className="text-slate-600">Access your secure banking dashboard</p>
                </div>
                {biometricAvailable && (
                  <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                    <Fingerprint className="h-4 w-4 text-slate-700" />
                    <span className="text-sm text-slate-800 font-medium">Biometric authentication available</span>
                  </div>
                )}
              </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="phone"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="phone-input"
                            placeholder="0801 234 5678"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            className="h-12 border-slate-200 focus:border-slate-600 focus:ring-slate-600/20 rounded-xl bg-slate-50/50"
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
                        <FormLabel className="text-slate-700 font-semibold">6-Digit PIN</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              data-testid="pin-input"
                              type={showPin ? "text" : "password"}
                              placeholder="••••••"
                              maxLength={6}
                              inputMode="numeric"
                              className="h-12 border-slate-200 focus:border-slate-600 focus:ring-slate-600/20 rounded-xl bg-slate-50/50 pr-12"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                            >
                              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <CustomLink href="/forgot-pin" className="font-semibold text-slate-700 hover:text-slate-800 transition-colors">
                      Forgot PIN?
                    </CustomLink>
                    <CustomLink href="/register" className="font-semibold text-slate-700 hover:text-slate-800 transition-colors" data-testid="register-link">
                      Open an account
                    </CustomLink>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                    disabled={isLoading} 
                    data-testid="login-button"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Log In</span>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                  {showRecovery && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      disabled={isRecovering}
                      onClick={handleRecoverAccount}
                    >
                      {isRecovering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recover Closed Account'}
                    </Button>
                  )}
                </form>
              </Form>
              
              {/* Enhanced Security Notice */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50 p-5">
                <div className="flex items-center gap-3 text-slate-700 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-slate-700" aria-hidden />
                  </div>
                  <span className="font-semibold">Protected session</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  We verify your device, enforce PIN retry limits, and align with NDIC coverage for every customer.
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>NDIC Insured</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>CBN Licensed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
        
        {/* Liveness Check Modal for New Devices */}
        <LivenessCheckModal
          open={showLivenessCheck}
          onSuccess={handleLivenessSuccess}
          deviceFingerprint={deviceFingerprint}
        />
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
