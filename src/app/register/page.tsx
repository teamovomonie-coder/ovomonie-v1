
"use client";

import { useState } from 'react';
import Link from 'next/link';
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
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";

const fullRegisterSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Must be a valid 11-digit Nigerian phone number.'),
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
    { id: 1, name: "Personal & Account Info", fields: ["fullName", "email", "phone", "nin", "address"] },
    { id: 2, name: "Login PIN", fields: ["loginPin", "confirmLoginPin"] },
    { id: 3, name: "Transaction PIN", fields: ["transactionPin", "confirmTransactionPin"] },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");

  const form = useForm<FullFormData>({
    resolver: zodResolver(fullRegisterSchema),
    defaultValues: {
        fullName: "", email: "", phone: "", nin: "", address: "",
        loginPin: "", confirmLoginPin: "", transactionPin: "", confirmTransactionPin: ""
    }
  });

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields, { shouldFocus: true });
    if (!output) return;
    
    if (currentStep < steps.length) {
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
        const generatedAccountNumber = rawPhoneNumber.length === 11 ? rawPhoneNumber.slice(-10) : '';
        setAccountNumber(generatedAccountNumber);
        
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
    <div className="animated-gradient-bg flex min-h-screen w-full items-center justify-center p-4">
       <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Form {...form}>
            <form onSubmit={form.handleSubmit(processRegistration)}>
                <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border-white/20 rounded-2xl">
                <CardHeader>
                    {currentStep < steps.length + 1 && (
                        <>
                        <div className="mx-auto"><OvoLogo /></div>
                        {currentStep < steps.length ? (
                             <>
                             <CardTitle className="text-2xl font-bold text-primary text-center pt-2">Create Your Account</CardTitle>
                             <CardDescription className="text-center text-muted-foreground">{steps[currentStep].name}</CardDescription>
                             <Progress value={progressValue} className="!mt-4" />
                            </>
                        ) : null}
                        </>
                    )}
                </CardHeader>
                <CardContent>
                    {currentStep > 0 && currentStep <= steps.length && (
                        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4" type="button">
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
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="you@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="08012345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>National Identification Number (NIN)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="11-digit NIN" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Residential Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your home address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" className="w-full" onClick={handleNext}>Continue</Button>
                            </div>
                        )}
                        {currentStep === 1 && (
                             <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="loginPin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Create 6-Digit Login PIN</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" maxLength={6} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmLoginPin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Login PIN</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" maxLength={6} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" className="w-full" onClick={handleNext}>Continue</Button>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="transactionPin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Create 4-Digit Transaction PIN</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••" maxLength={4} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmTransactionPin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Transaction PIN</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••" maxLength={4} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin mr-2" />}Create Account</Button>
                            </div>
                        )}
                        {currentStep === 3 && (
                             <div className="text-center p-4 flex flex-col items-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Welcome to OVOMONIE!</h2>
                                <p className="text-muted-foreground max-w-md">Your account has been successfully created.</p>
                                <div className="p-4 bg-muted rounded-lg text-center my-6 w-full">
                                    <p className="text-sm text-muted-foreground">Your Account Number</p>
                                    <p className="text-3xl font-bold tracking-widest">{accountNumber}</p>
                                </div>
                                <Button onClick={() => router.push('/login')} className="w-full">
                                    Go to Login
                                </Button>
                            </div>
                        )}
                    </motion.div>
                    </AnimatePresence>
                     {currentStep < 4 && (
                        <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline text-primary font-semibold">
                            Log In
                        </Link>
                        </div>
                    )}
                </CardContent>
                </Card>
            </form>
        </Form>
      </motion.div>
    </div>
  );
}
