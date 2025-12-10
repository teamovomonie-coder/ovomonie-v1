
"use client";

import { useMemo, useState } from 'react';
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
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-light-bg via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-stretch lg:px-8 xl:px-12">
        <div className="lg:hidden space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-md shadow-primary/10 backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mx-7" >
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Create an OVOMONIE account
                          </div>
           </div>

        <div className="flex flex-1 items-center pb-10 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processRegistration)}>
                <Card className="border border-slate-100/80 shadow-xl shadow-primary/5 backdrop-blur-sm">
                  <CardHeader className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <OvoLogo width={44} height={44} />
                        <div className="space-y-2">
                          
                        

                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
                        PIN-first
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-muted/40 p-3">
                      <Progress value={progressValue} className="!mt-0" />
                      {currentStep < steps.length && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{steps[currentStep].name}</span>
                          <span>Step {currentStep + 1} of {steps.length}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentStep > 0 && currentStep <= steps.length && (
                      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2" type="button">
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
                          <div className="space-y-4">
                            <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
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
                            )} />
                            <Button type="button" className="w-full" onClick={handleNext} disabled={isLoading}>
                              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continue
                            </Button>
                          </div>
                        )}
                        {currentStep === 1 && (
                          <div className="space-y-4">
                            <FormField control={form.control} name="otp" render={({ field }) => ( <FormItem><FormLabel>Verification Code</FormLabel><FormControl><Input placeholder="6-digit code from your email" inputMode="numeric" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <Button type="button" className="w-full" onClick={handleNext}>Verify Email</Button>
                            <p className="text-center text-sm text-muted-foreground">Didn&apos;t receive a code? <button type="button" className="underline">Resend</button></p>
                          </div>
                        )}
                        {currentStep === 2 && (
                          <div className="space-y-4">
                            <FormField control={form.control} name="nin" render={({ field }) => ( <FormItem><FormLabel>National Identification Number (NIN)</FormLabel><FormControl><Input placeholder="11-digit NIN" inputMode="numeric" maxLength={11} {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Residential Address</FormLabel><FormControl><Input placeholder="Your home address" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <Button type="button" className="w-full" onClick={handleNext}>Continue</Button>
                          </div>
                        )}
                        {currentStep === 3 && (
                          <div className="space-y-4">
                            <FormField control={form.control} name="loginPin" render={({ field }) => ( <FormItem><FormLabel>Create 6-Digit Login PIN</FormLabel><FormControl><div className="relative"><Input type={showLoginPin ? "text" : "password"} placeholder="••••••" maxLength={6} inputMode="numeric" {...field} /><button type="button" onClick={() => setShowLoginPin(!showLoginPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="confirmLoginPin" render={({ field }) => ( <FormItem><FormLabel>Confirm Login PIN</FormLabel><FormControl><div className="relative"><Input type={showConfirmLoginPin ? "text" : "password"} placeholder="••••••" maxLength={6} inputMode="numeric" {...field} /><button type="button" onClick={() => setShowConfirmLoginPin(!showConfirmLoginPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showConfirmLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="transactionPin" render={({ field }) => ( <FormItem><FormLabel>Create 4-Digit Transaction PIN</FormLabel><FormControl><div className="relative"><Input type={showTransactionPin ? "text" : "password"} placeholder="••••" maxLength={4} inputMode="numeric" {...field} /><button type="button" onClick={() => setShowTransactionPin(!showTransactionPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showTransactionPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="confirmTransactionPin" render={({ field }) => ( <FormItem><FormLabel>Confirm Transaction PIN</FormLabel><FormControl><div className="relative"><Input type={showConfirmTransactionPin ? "text" : "password"} placeholder="••••" maxLength={4} inputMode="numeric" {...field} /><button type="button" onClick={() => setShowConfirmTransactionPin(!showConfirmTransactionPin)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showConfirmTransactionPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem> )} />
                            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button>
                          </div>
                        )}
                        {currentStep === 4 && (
                          <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 p-6 text-center">
                            <CheckCircle className="h-14 w-14 text-green-600" />
                            <h2 className="text-2xl font-bold">Welcome to OVOMONIE!</h2>
                            <p className="text-muted-foreground max-w-md">
                              Your Nigerian microfinance account is live with CBN/NDIC-aligned, PIN-first security.
                            </p>
                            <div className="w-full rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                              <p className="text-sm text-muted-foreground">Your Account Number</p>
                              <p className="text-3xl font-bold tracking-widest text-foreground">{accountNumber}</p>
                            </div>
                            <Button asChild className="w-full">
                              <CustomLink href="/login">Go to Login</CustomLink>
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    {currentStep < 4 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-muted/30 p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 text-foreground">
                          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                          <span className="font-semibold">What you&apos;ll need</span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed">
                          Your Nigerian phone number, email verification code, NIN, and 6-digit login PIN. We verify devices and enforce retry limits to protect your account.
                        </p>
                      </div>
                    )}
                    {currentStep < 4 && (
                      <div className="text-center text-sm">
                        Already have an account?{" "}
                        <CustomLink href="/login" className="underline text-primary font-semibold">
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
