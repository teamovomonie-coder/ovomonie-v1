
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2, Upload, User, Shield, KeyRound, Bell, Mail, Phone, Lock, MessageCircle, ArrowLeftRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import CustomLink from '../layout/custom-link';

// --- KYC Tier Data ---
const kycTiers = [
  {
    level: 1,
    name: 'Tier 1',
    description: 'Basic account features',
    dailyLimit: '₦50,000',
    requirements: ['Phone Number', 'Email Address', 'Basic Bio-Data'],
  },
  {
    level: 2,
    name: 'Tier 2',
    description: 'Higher limits & more features',
    dailyLimit: '₦1,000,000',
    requirements: ['BVN or NIN Verification', 'Live Selfie Capture', 'Proof of Address'],
  },
  {
    level: 3,
    name: 'Tier 3',
    description: 'Full business & unlimited features',
    dailyLimit: 'Unlimited',
    requirements: ['CAC Documents', 'Proof of Income/Company Statement'],
  },
];

// --- Zod Schemas ---
const tier2Schema = z.object({
  bvn: z.string().length(11, "BVN must be 11 digits."),
  addressProof: z.any().optional(), // File upload is complex, so we'll make it optional for now
});

const tier3Schema = z.object({
  cacNumber: z.string().min(5, "A valid CAC number is required."),
  cacDocument: z.any().optional(),
});

// --- Main Component ---
export function ProfileKycDashboard() {
  const { user, fetchUserData } = useAuth();
  const currentTier = user?.kycTier || 1;
  
  const [isTier2DialogOpen, setIsTier2DialogOpen] = useState(false);
  const [isTier3DialogOpen, setIsTier3DialogOpen] = useState(false);
  
  const profileCompleteness = (currentTier / kycTiers.length) * 100;
  
  const handleUpgradeSuccess = async () => {
    setIsTier2DialogOpen(false);
    setIsTier3DialogOpen(false);
    await fetchUserData(); // Refresh user data to get the new tier
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Profile & KYC</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Summary & Actions */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="relative mx-auto h-32 w-32">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="3"
                                strokeDasharray={`${profileCompleteness}, 100`}
                            />
                        </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">{Math.round(profileCompleteness)}%</span>
                            <span className="text-sm text-muted-foreground">Complete</span>
                        </div>
                    </div>
                     <p className="mt-4 text-sm text-muted-foreground">You are on <span className="font-bold text-primary">Tier {currentTier}</span>. Complete the next steps to unlock higher limits.</p>
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Account</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start gap-3"><CustomLink href="/statements"><ArrowLeftRight /> Transaction History</CustomLink></Button>
                <Button asChild variant="outline" className="w-full justify-start gap-3"><CustomLink href="/security"><Shield /> Security Settings</CustomLink></Button>
                <Button asChild variant="outline" className="w-full justify-start gap-3"><CustomLink href="/notifications"><Bell /> Notifications</CustomLink></Button>
                <Button asChild variant="outline" className="w-full justify-start gap-3"><CustomLink href="/support"><MessageCircle /> Support</CustomLink></Button>
              </CardContent>
            </Card>
        </div>

        {/* Right Column: KYC & Personal Info */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>KYC Verification Tiers</CardTitle>
                    <CardDescription>Complete tiers to increase your transaction limits and unlock new features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {kycTiers.map(tier => (
                        <Card key={tier.level} className={tier.level <= currentTier ? 'bg-green-50 border-green-200' : 'bg-muted/50'}>
                             <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {tier.level <= currentTier && <CheckCircle className="text-green-600"/>}
                                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                                    </div>
                                    <CardDescription>Daily Limit: {tier.dailyLimit}</CardDescription>
                                </div>
                                {tier.level === currentTier + 1 && (
                                     <Button onClick={() => tier.level === 2 ? setIsTier2DialogOpen(true) : setIsTier3DialogOpen(true)}>Upgrade</Button>
                                )}
                            </CardHeader>
                             <CardContent>
                                <ul className="text-sm space-y-1 list-disc pl-5">
                                    {tier.requirements.map(req => <li key={req}>{req}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><User /><span>Full Name</span></div><span className="font-semibold">{user?.fullName}</span></div>
                    <Separator />
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><Mail /><span>Email Address</span></div><span className="font-semibold">paago@example.com</span></div>
                     <Separator />
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><Phone /><span>Phone Number</span></div><span className="font-semibold">08012345678</span></div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="ml-auto" disabled>Edit Profile</Button>
                </CardFooter>
            </Card>
        </div>
      </div>

      <Tier2Dialog open={isTier2DialogOpen} onOpenChange={setIsTier2DialogOpen} onUpgrade={handleUpgradeSuccess} />
      <Tier3Dialog open={isTier3DialogOpen} onOpenChange={setIsTier3DialogOpen} onUpgrade={handleUpgradeSuccess} />
    </div>
  );
}


function Tier2Dialog({ open, onOpenChange, onUpgrade }: { open: boolean, onOpenChange: (open: boolean) => void, onUpgrade: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof tier2Schema>>({
        resolver: zodResolver(tier2Schema),
        defaultValues: { bvn: "" },
    });

    const onSubmit = async (data: z.infer<typeof tier2Schema>) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/kyc/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...data, newTier: 2 }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Upgrade failed.');

            toast({ title: "KYC Submitted!", description: "Your details have been submitted for verification." });
            onUpgrade();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upgrade Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade to Tier 2</DialogTitle>
                    <DialogDescription>Provide your BVN to upgrade. This will increase your transaction limits.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="bvn" render={({ field }) => ( <FormItem><FormLabel>Bank Verification Number (BVN)</FormLabel><FormControl><Input placeholder="11-digit BVN" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="addressProof" render={({ field: { onChange, ...fieldProps } }) => ( <FormItem><FormLabel>Proof of Address (e.g., Utility Bill)</FormLabel><FormControl><Input type="file" onChange={(e) => onChange(e.target.files)} {...fieldProps} /></FormControl><FormMessage /></FormItem> )} />
                        <Alert><Shield className="h-4 w-4" /><AlertTitle>Liveness Check Required</AlertTitle><AlertDescription>In a real app, you would be prompted to take a live selfie here to verify your identity against your BVN photo.</AlertDescription></Alert>
                        <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Verification</Button></DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}

function Tier3Dialog({ open, onOpenChange, onUpgrade }: { open: boolean, onOpenChange: (open: boolean) => void, onUpgrade: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof tier3Schema>>({
        resolver: zodResolver(tier3Schema),
        defaultValues: { cacNumber: "" },
    });

    const onSubmit = async (data: z.infer<typeof tier3Schema>) => {
        setIsLoading(true);
        try {
             const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/kyc/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...data, newTier: 3 }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Upgrade failed.');

            toast({ title: "Business KYC Submitted!", description: "Your business documents are under review." });
            onUpgrade();
        } catch(error) {
             toast({ variant: 'destructive', title: 'Upgrade Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade to Tier 3 (Business)</DialogTitle>
                    <DialogDescription>Submit your company's CAC documents to unlock unlimited transactions.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="cacNumber" render={({ field }) => ( <FormItem><FormLabel>CAC Registration Number</FormLabel><FormControl><Input placeholder="RC123456" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="cacDocument" render={({ field: { onChange, ...fieldProps } }) => ( <FormItem><FormLabel>Upload CAC Certificate</FormLabel><FormControl><Input type="file" onChange={(e) => onChange(e.target.files)} {...fieldProps} /></FormControl><FormMessage /></FormItem> )} />
                        <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review</Button></DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}
