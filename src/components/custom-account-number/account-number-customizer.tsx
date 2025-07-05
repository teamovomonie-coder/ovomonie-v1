
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import CustomLink from '@/components/layout/custom-link';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, Hash, KeyRound, Loader2 } from "lucide-react";

// Schemas
const phoneSchema = z.object({
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Must be a valid 11-digit Nigerian phone number.'),
});

const pinSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits."),
  confirmPin: z.string().length(4, "PIN must be 4 digits."),
}).refine(data => data.pin === data.confirmPin, {
    message: "PINs do not match.",
    path: ['confirmPin'],
});

// Sub-components for each step
function PhoneNumberForm({ onNext }: { onNext: (phone: string) => void }) {
  const form = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const onSubmit = (data: z.infer<typeof phoneSchema>) => {
    onNext(data.phone);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter Your Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 08012345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Generate Account Number
        </Button>
      </form>
    </Form>
  );
}

function PinForm({ accountNumber, onNext }: { accountNumber: string; onNext: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "", confirmPin: "" },
  });

  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast({ title: 'Success!', description: 'Your new account number and PIN have been set.' });
    onNext();
  };
  
  return (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Your New Account Number</p>
            <p className="text-3xl font-bold tracking-widest flex items-center justify-center gap-2"><Hash className="h-6 w-6"/>{accountNumber}</p>
        </div>
        <p className="text-sm text-muted-foreground">Secure your new account by setting a 4-digit transaction PIN.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Create 4-Digit PIN</FormLabel>
                  <FormControl>
                    <Input type="password" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="confirmPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm PIN</FormLabel>
                  <FormControl>
                    <Input type="password" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set PIN & Activate Account
            </Button>
          </form>
        </Form>
    </div>
  );
}

function SuccessScreen({ accountNumber, onDone }: { accountNumber: string, onDone: () => void }) {
    return (
        <div className="text-center p-4 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Account Ready!</h2>
            <p className="text-muted-foreground max-w-md">Your new Ovomonie account number is now active. You can start receiving money with it.</p>
             <div className="p-4 bg-muted rounded-lg text-center my-6">
                <p className="text-sm text-muted-foreground">Your Account Number</p>
                <p className="text-3xl font-bold tracking-widest flex items-center justify-center gap-2"><Hash className="h-6 w-6"/>{accountNumber}</p>
            </div>
            <Button onClick={onDone} asChild>
                <CustomLink href="/dashboard">Back to Dashboard</CustomLink>
            </Button>
        </div>
    );
}

// Main Component
export function AccountNumberCustomizer() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const accountNumber = phoneNumber.slice(-10);

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setStep(2);
  };
  
  const handlePinSubmit = () => {
    setStep(3);
  };
  
  const resetFlow = () => {
    setPhoneNumber("");
    setStep(1);
  };
  
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && <PhoneNumberForm onNext={handlePhoneSubmit} />}
          {step === 2 && <PinForm accountNumber={accountNumber} onNext={handlePinSubmit} />}
          {step === 3 && <SuccessScreen accountNumber={accountNumber} onDone={resetFlow} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
