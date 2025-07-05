
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import CustomLink from '@/components/layout/custom-link';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OvoLogo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

// Schemas for each step
const phoneSchema = z.object({
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Must be a valid 11-digit Nigerian phone number.'),
});

const resetPinSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits.'),
  newPin: z.string().length(6, 'New PIN must be 6 digits.'),
  confirmPin: z.string().length(6, 'Confirmation PIN must be 6 digits.'),
}).refine(data => data.newPin === data.confirmPin, {
    message: "PINs do not match.",
    path: ['confirmPin'],
});

export default function ForgotPinPage() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const resetForm = useForm<z.infer<typeof resetPinSchema>>({
    resolver: zodResolver(resetPinSchema),
    defaultValues: { otp: '', newPin: '', confirmPin: '' },
  });

  const handlePhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    // In a real app, you would call an API to send an OTP here.
    // For this simulation, we'll just check if the user exists.
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPhoneNumber(data.phone);
    setIsLoading(false);
    setStep(1);
    toast({
        title: "OTP Sent (Simulated)",
        description: `An OTP has been sent to ${data.phone}.`,
    });
  };

  const handleResetSubmit = async (data: z.infer<typeof resetPinSchema>) => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/auth/reset-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber, newPin: data.newPin }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to reset PIN.');
        }

        toast({
            title: 'PIN Reset Successful',
            description: 'You can now log in with your new PIN.',
        });
        setStep(2);

    } catch (error) {
        if (error instanceof Error) {
            toast({
                variant: 'destructive',
                title: 'PIN Reset Failed',
                description: error.message,
            });
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">
        <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <OvoLogo />
              </div>
              {step === 0 && <CardTitle>Forgot Your PIN?</CardTitle>}
              {step === 1 && <CardTitle>Reset Your PIN</CardTitle>}
              {step === 2 && <CardTitle>Success!</CardTitle>}
              
              {step === 0 && <CardDescription>Enter your phone number to receive a verification code.</CardDescription>}
              {step === 1 && <CardDescription>An OTP has been sent to {phoneNumber}.</CardDescription>}
              {step === 2 && <CardDescription>Your PIN has been successfully reset.</CardDescription>}
            </CardHeader>
            <CardContent>
              {step === 0 && (
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-6">
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="08012345678" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                    </Button>
                  </form>
                </Form>
              )}
              {step === 1 && (
                 <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
                    <FormField control={resetForm.control} name="otp" render={({ field }) => ( <FormItem><FormLabel>One-Time Password (OTP)</FormLabel><FormControl><Input placeholder="6-digit code" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={resetForm.control} name="newPin" render={({ field }) => ( <FormItem><FormLabel>New 6-Digit PIN</FormLabel><FormControl><Input type="password" placeholder="••••••" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={resetForm.control} name="confirmPin" render={({ field }) => ( <FormItem><FormLabel>Confirm New PIN</FormLabel><FormControl><Input type="password" placeholder="••••••" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Reset PIN'}
                    </Button>
                  </form>
                </Form>
              )}
              {step === 2 && (
                <div className="flex flex-col items-center text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <Button onClick={() => router.push('/login')} className="w-full">
                        Back to Login
                    </Button>
                </div>
              )}

                <div className="mt-4 text-center text-sm">
                    {step < 2 && (
                         <Button variant="link" onClick={() => step === 0 ? router.push('/login') : setStep(0)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    )}
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
