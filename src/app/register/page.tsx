
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OvoLogo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Must be a valid 11-digit Nigerian phone number.'),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  pin: z.string().length(6, "Your PIN must be 6 digits."),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', pin: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 2000));
    setIsLoading(false);
    toast({
        title: 'Registration Successful!',
        description: 'Your account has been created. Please log in.',
    });
    router.push('/login');
  };

  return (
    <div className="animated-gradient-bg flex min-h-screen w-full items-center justify-center p-4">
       <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-white/20 rounded-2xl">
          <CardHeader className="text-center">
             <div className="mx-auto mb-4 bg-primary rounded-full p-3 w-20 h-20 flex items-center justify-center shadow-lg">
                <OvoLogo className="h-8 w-32" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Create Your Account</CardTitle>
            <CardDescription className="text-muted-foreground">Join Ovomonie to start banking intelligently.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem> <FormLabel>Phone Number</FormLabel> <FormControl> <Input placeholder="08012345678" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email Address</FormLabel> <FormControl> <Input type="email" placeholder="you@example.com" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="••••••••" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="pin" render={({ field }) => ( <FormItem> <FormLabel>6-Digit PIN</FormLabel> <FormControl> <Input type="password" placeholder="••••••" maxLength={6} {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Register'}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline text-primary font-semibold">
                Log In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
