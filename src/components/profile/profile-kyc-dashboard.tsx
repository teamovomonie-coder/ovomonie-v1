
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2, Upload, User, Shield, KeyRound, Bell, Mail, Phone, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- KYC Tier Data ---
const kycTiers = [
  {
    level: 1,
    name: 'Tier 1',
    description: 'Basic account features',
    dailyLimit: '₦50,000',
    requirements: ['Phone Number', 'Email Address', 'Basic Bio-Data'],
    isComplete: true,
  },
  {
    level: 2,
    name: 'Tier 2',
    description: 'Higher limits & more features',
    dailyLimit: '₦1,000,000',
    requirements: ['BVN or NIN Verification', 'Live Selfie Capture', 'Proof of Address'],
    isComplete: false,
  },
  {
    level: 3,
    name: 'Tier 3',
    description: 'Full business & unlimited features',
    dailyLimit: 'Unlimited',
    requirements: ['CAC Documents', 'Proof of Income/Company Statement'],
    isComplete: false,
  },
];

// --- Zod Schemas ---
const tier2Schema = z.object({
  bvn: z.string().length(11, "BVN must be 11 digits."),
  addressProof: z.any().refine(files => files?.length === 1, "Proof of address is required."),
});

const tier3Schema = z.object({
  cacNumber: z.string().min(5, "A valid CAC number is required."),
  cacDocument: z.any().refine(files => files?.length === 1, "CAC document is required."),
});

// --- Main Component ---
export function ProfileKycDashboard() {
  const [currentTier, setCurrentTier] = useState(1);
  const [isTier2DialogOpen, setIsTier2DialogOpen] = useState(false);
  const [isTier3DialogOpen, setIsTier3DialogOpen] = useState(false);
  
  const profileCompleteness = (currentTier / kycTiers.length) * 100;
  
  const handleUpgrade = (newTier: number) => {
    setCurrentTier(newTier);
    if (newTier === 2) setIsTier2DialogOpen(false);
    if (newTier === 3) setIsTier3DialogOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Profile & KYC</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Summary & Security */}
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
                <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2"><Lock /> Change Password</Button>
                    <Button variant="outline" className="w-full justify-start gap-2"><KeyRound /> Change Transaction PIN</Button>
                    <Button variant="outline" className="w-full justify-start gap-2"><Bell /> Notification Preferences</Button>
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
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><User /><span>Full Name</span></div><span className="font-semibold">Paago David</span></div>
                    <Separator />
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><Mail /><span>Email Address</span></div><span className="font-semibold">paago@example.com</span></div>
                     <Separator />
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><Phone /><span>Phone Number</span></div><span className="font-semibold">08012345678</span></div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="ml-auto">Edit Profile</Button>
                </CardFooter>
            </Card>
        </div>
      </div>

      <Tier2Dialog open={isTier2DialogOpen} onOpenChange={setIsTier2DialogOpen} onUpgrade={() => handleUpgrade(2)} />
      <Tier3Dialog open={isTier3DialogOpen} onOpenChange={setIsTier3DialogOpen} onUpgrade={() => handleUpgrade(3)} />
    </div>
  );
}


function Tier2Dialog({ open, onOpenChange, onUpgrade }: { open: boolean, onOpenChange: (open: boolean) => void, onUpgrade: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof tier2Schema>>({
        resolver: zodResolver(tier2Schema),
    });

    const onSubmit = async () => {
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 2000));
        toast({ title: "KYC Submitted!", description: "Your details are being verified. This may take a few minutes." });
        setIsLoading(false);
        onUpgrade();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade to Tier 2</DialogTitle>
                    <DialogDescription>Provide your BVN and a proof of address to upgrade.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="bvn" render={({ field }) => ( <FormItem><FormLabel>Bank Verification Number (BVN)</FormLabel><FormControl><Input placeholder="11-digit BVN" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="addressProof" render={({ field: { onChange, ...field } }) => ( <FormItem><FormLabel>Proof of Address (e.g., Utility Bill)</FormLabel><FormControl><Input type="file" onChange={(e) => onChange(e.target.files)} {...field} /></FormControl><FormMessage /></FormItem> )} />
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
    });

    const onSubmit = async () => {
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 2000));
        toast({ title: "Business KYC Submitted!", description: "Your business documents are under review." });
        setIsLoading(false);
        onUpgrade();
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
                        <FormField control={form.control} name="cacDocument" render={({ field: { onChange, ...field } }) => ( <FormItem><FormLabel>Upload CAC Certificate</FormLabel><FormControl><Input type="file" onChange={(e) => onChange(e.target.files)} {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review</Button></DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}
