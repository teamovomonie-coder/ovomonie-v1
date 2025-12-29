
"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomLink from '@/components/layout/custom-link';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OvoLogo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, ShieldCheck, Clock3, Smartphone, Building2, Eye, EyeOff } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const MOCK_OTP = "123456";

const fullRegisterSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Must be a valid 11-digit Nigerian phone number.'),
  otp: z.string().length(6, "OTP must be 6 digits."),
  nin: z.string().length(11, "NIN must be 11 digits."),
  address: z.string().min(10, "Please provide your residential address."),
  loginPin: z.string().regex(/^\d{6}$/, "Login PIN must be 6 digits."),
  confirmLoginPin: z.string().regex(/^\d{6}$/, "Confirmation PIN must be 6 digits."),
  transactionPin: z.string().regex(/^\d{4}$/, "Transaction PIN must be 4 digits."),
  confirmTransactionPin: z.string().regex(/^\d{4}$/, "Confirmation PIN must be 4 digits."),
}).refine(data => data.loginPin === data.confirmLoginPin, {
    message: "Login PINs do not match.",
    path: ['confirmLoginPin'],
}).refine(data => data.transactionPin === data.confirmTransactionPin, {
    message: "Transaction PINs do not match.",
    path: ['confirmTransactionPin'],
});

type FullFormData = z.infer<typeof fullRegisterSchema>;

const steps: { id: number, name: string, fields: FieldPath<FullFormData>[] }[] = [
    { id: 1, name: "Create Account", fields: ["fullName", "email", "phone"] },
    { id: 2, name: "Verify Email", fields: ["otp"] },
    { id: 3, name: "Complete Profile", fields: ["nin", "address"] },
    { id: 4, name: "Secure Your Account", fields: ["loginPin", "confirmLoginPin", "transactionPin", "confirmTransactionPin"] },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [showConfirmLoginPin, setShowConfirmLoginPin] = useState(false);
  const [showTransactionPin, setShowTransactionPin] = useState(false);
  const [showConfirmTransactionPin, setShowConfirmTransactionPin] = useState(false);
  const trustSignals = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'CBN Licensed & NDIC Covered',
        description: 'Savings and deposits safeguarded under Nigerian microfinance regulation.',
      },
      {
        icon: Smartphone,
        title: 'Device-Aware Onboarding',
        description: 'PIN-first enrollment with fraud monitoring on new devices.',
      },
      {
        icon: Clock3,
        title: '24/7 Service',
        description: 'Open and manage your account anytime, anywhere in Nigeria.',
      },
      {
        icon: Building2,
        title: 'Built for Nigerians',
        description: 'BVN-aligned flows for individuals, agents, and SMEs.',
      },
    ],
    [],
  );

  const form = useForm<FullFormData>({
    resolver: zodResolver(fullRegisterSchema),
    defaultValues: {
        fullName: "", email: "", phone: "", otp: "",
        nin: "", address: "",
        loginPin: "", confirmLoginPin: "", transactionPin: "", confirmTransactionPin: ""
    }
  });

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields, { shouldFocus: true });
    if (!output) return;
    
    // Logic for step 0 (sending OTP)
    if (currentStep === 0) {
        setIsLoading(true);
        // Simulate API call to check email/phone and send OTP
        await new Promise(res => setTimeout(res, 1000));
        setIsLoading(false);
        toast({
            title: "Verification Code Sent!",
            description: `A 6-digit code has been sent to ${form.getValues('email')}. (Hint: Use ${MOCK_OTP})`,
        });
        setCurrentStep(prev => prev + 1);
        return;
    }

    // Logic for step 1 (verifying OTP)
    if (currentStep === 1) {
        if (form.getValues('otp') !== MOCK_OTP) {
            form.setError('otp', { type: 'manual', message: 'Invalid verification code.' });
            return;
        }
        toast({
            title: "Email Verified!",
            description: "You can now complete your registration.",
        });
        setCurrentStep(prev => prev + 1);
        return;
    }

    if (currentStep < steps.length -1) {
        setCurrentStep(prev => prev + 1);
    }
  };

  const processRegistration = async (data: FullFormData) => {
      setIsLoading(true);
      try {
        // Map frontend field names to API expected field names
        const apiData = {
          phone: data.phone,
          email: data.email,
          full_name: data.fullName, // Map fullName to full_name
          pin: data.transactionPin, // Use 4-digit transaction PIN as the main PIN
        };
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed.');
        }
        
        const rawPhoneNumber = form.getValues('phone');
        if (rawPhoneNumber.length >= 10) {
            const lastTenDigits = rawPhoneNumber.slice(-10);
            const generatedAccountNumber = lastTenDigits.split('').reverse().join('');
            setAccountNumber(generatedAccountNumber);
        }
        
        toast({
            title: 'Registration Successful!',
            description: 'Your account has been created.',
        });
        
        // Show success screen - wait for user to click button
        setCurrentStep(prev => prev + 1);

      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Registration Error',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      } finally {
        setIsLoading(false);
      }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const progressValue = (currentStep / steps.length) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Enhanced Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl animate-pulse delay-500" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-12"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-300/10 to-transparent transform -rotate-12"></div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-stretch lg:px-8 xl:px-12">
        {/* Left Panel - Enhanced */}
        <div className="hidden w-full max-w-xl flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-800/90 to-blue-900/90 backdrop-blur-xl border border-blue-400/20 px-10 py-12 text-white shadow-2xl lg:flex">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <OvoLogo className="drop-shadow-2xl" />
              <div>
                <p className="text-sm text-blue-200/80">OVOMONIE Microfinance</p>
                <p className="text-lg font-semibold text-white">Account Registration</p>
              </div>
            </div>
            <Badge className="border-blue-300/30 bg-blue-500/20 text-blue-100 backdrop-blur-sm">CBN Licensed</Badge>
          </div>

          <div className="mt-10 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70 font-medium">Secure Registration</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Join thousands of Nigerians banking securely</h1>
              <p className="mt-3 text-blue-100/90 leading-relaxed">
                Open your NDIC-insured account with PIN-first security and instant access to digital banking.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trustSignals.map((item, index) => (
                <div
                key={item.title}
                className="rounded-2xl border border-blue-400/20 bg-white/10 backdrop-blur-sm p-4 shadow-lg hover:bg-white/15 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <item.icon className="h-4 w-4 text-blue-300" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-2 text-sm text-blue-100/80 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Support Section */}
        <div className="mt-10 rounded-2xl border border-blue-400/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Need help with registration?
              </div>
              <p className="text-sm text-blue-100/80 mt-1">Call 0700-OVO-CARE or visit any of our agent locations.</p>
            </div>
            <Badge className="border-green-400/30 bg-green-500/20 text-green-100 text-[11px] backdrop-blur-sm" variant="secondary">
              24/7 Support
            </Badge>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-400/20">
            <p className="text-xs text-blue-200/70 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Your information is encrypted and NDIC-protected.
            </p>
          </div>
        </div>
      </div>

        {/* Mobile Header */}
        <div className="lg:hidden space-y-4 rounded-3xl border border-blue-200/20 bg-white/95 backdrop-blur-xl p-6 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Create an OVOMONIE account
          </div>
        </div>

        {/* Right Panel - Enhanced */}
        <div className="flex flex-1 items-center pb-10 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processRegistration)}>
                <Card className="border border-blue-200/20 bg-white/95 backdrop-blur-xl shadow-2xl shadow-blue-900/20 rounded-3xl">
                  <CardHeader className="space-y-6 pb-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <OvoLogo width={44} height={44} />
                        <div className="space-y-1">
                          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                          <p className="text-slate-600">Join the future of Nigerian banking</p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-0">
                        PIN-first Security
                      </Badge>
                    </div>
                    
                    {/* Enhanced Progress Section */}
                    <div className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                      <Progress value={progressValue} className="!mt-0 h-2" />
                      {currentStep < steps.length && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">{steps[currentStep].name}</span>
                          <span className="text-slate-500">Step {currentStep + 1} of {steps.length}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    {currentStep > 0 && currentStep <= steps.length && (
                      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2 hover:bg-slate-100" type="button">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        {currentStep === 0 && (
                          <div className="space-y-5">
                            <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Full Name</FormLabel><FormControl><Input placeholder="John Doe" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="0801 234 5678"
                                    inputMode="numeric"
                                    autoComplete="tel-national"
                                    className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <Button 
                              type="button" 
                              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                              onClick={handleNext} 
                              disabled={isLoading}
                            >
                              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <span>Continue</span>
                            </Button>
                          </div>
                        )}
                        {currentStep === 1 && (
                          <div className="space-y-5">
                            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                              <p className="text-sm text-blue-700 font-medium">Verification code sent to your email</p>
                              <p className="text-xs text-blue-600 mt-1">Check your inbox and enter the 6-digit code</p>
                            </div>
                            <FormField control={form.control} name="otp" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Verification Code</FormLabel><FormControl><Input placeholder="6-digit code from your email" inputMode="numeric" maxLength={6} className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50 text-center text-lg tracking-widest" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <Button type="button" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" onClick={handleNext}>Verify Email</Button>
                            <p className="text-center text-sm text-slate-600">Didn&apos;t receive a code? <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold underline">Resend</button></p>
                          </div>
                        )}
                        {currentStep === 2 && (
                          <div className="space-y-5">
                            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                              <p className="text-sm text-green-700 font-medium">Email verified successfully!</p>
                            </div>
                            <FormField control={form.control} name="nin" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">National Identification Number (NIN)</FormLabel><FormControl><Input placeholder="11-digit NIN" inputMode="numeric" maxLength={11} className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Residential Address</FormLabel><FormControl><Input placeholder="Your home address" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <Button type="button" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" onClick={handleNext}>Continue</Button>
                          </div>
                        )}
                        {currentStep === 3 && (
                          <div className="space-y-5">
                            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                              <ShieldCheck className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                              <p className="text-sm text-amber-700 font-medium">Secure your account with PINs</p>
                              <p className="text-xs text-amber-600 mt-1">These will be used for login and transactions</p>
                            </div>
                            <FormField control={form.control} name="loginPin" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Create 6-Digit Login PIN</FormLabel><FormControl><div className="relative"><Input type={showLoginPin ? "text" : "password"} placeholder="••••••" maxLength={6} inputMode="numeric" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50 pr-12" {...field} /><button type="button" onClick={() => setShowLoginPin(!showLoginPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">{showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="confirmLoginPin" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Confirm Login PIN</FormLabel><FormControl><div className="relative"><Input type={showConfirmLoginPin ? "text" : "password"} placeholder="••••••" maxLength={6} inputMode="numeric" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50 pr-12" {...field} /><button type="button" onClick={() => setShowConfirmLoginPin(!showConfirmLoginPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">{showConfirmLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="transactionPin" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Create 4-Digit Transaction PIN</FormLabel><FormControl><div className="relative"><Input type={showTransactionPin ? "text" : "password"} placeholder="••••" maxLength={4} inputMode="numeric" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50 pr-12" {...field} /><button type="button" onClick={() => setShowTransactionPin(!showTransactionPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">{showTransactionPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="confirmTransactionPin" render={({ field }) => ( <FormItem><FormLabel className="text-slate-700 font-semibold">Confirm Transaction PIN</FormLabel><FormControl><div className="relative"><Input type={showConfirmTransactionPin ? "text" : "password"} placeholder="••••" maxLength={4} inputMode="numeric" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-slate-50/50 pr-12" {...field} /><button type="button" onClick={() => setShowConfirmTransactionPin(!showConfirmTransactionPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">{showConfirmTransactionPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <Button 
                              type="submit" 
                              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                              disabled={isLoading}
                            >
                              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <span>Create Account</span>
                            </Button>
                          </div>
                        )}
                        {currentStep === 4 && (
                          <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-r from-green-50 to-slate-50 border border-green-200 p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to OVOMONIE!</h2>
                              <p className="text-slate-600 max-w-md leading-relaxed">
                                Your Nigerian microfinance account is live with CBN/NDIC-aligned, PIN-first security.
                              </p>
                            </div>
                            <div className="w-full rounded-2xl border-2 border-dashed border-slate-700 bg-white p-6 shadow-sm">
                              <p className="text-sm text-slate-600 font-medium mb-2">Your Account Number</p>
                              <p className="text-4xl font-bold tracking-widest text-slate-800 mb-2">{accountNumber}</p>
                              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>NDIC Insured</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>CBN Licensed</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>PIN Secured</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <strong>Important:</strong> Save your account number. You'll need it to log in.
                            </p>
                            <Button 
                              type="button" 
                              className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                              onClick={() => router.push('/login')}
                            >
                              Go to Login
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    {currentStep < 4 && (
                      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                        <div className="flex items-center gap-3 text-slate-700 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden />
                          </div>
                          <span className="font-semibold">What you&apos;ll need</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          Your Nigerian phone number, email verification code, NIN, and 6-digit login PIN. We verify devices and enforce retry limits to protect your account.
                        </p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-100">
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
                    )}
                    {currentStep < 4 && (
                      <div className="text-center text-sm">
                        Already have an account?{" "}
                        <CustomLink href="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline transition-colors">
                            Log In
                        </CustomLink>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
